import passport from 'passport';
import { Strategy as GitHubStrategy } from 'passport-github2';
import { Strategy as JwtStrategy, ExtractJwt } from 'passport-jwt';
import { prisma } from '../lib/prisma';

export function setupPassport() {
  // GitHub OAuth Strategy
  passport.use(new GitHubStrategy({
    clientID: process.env.GITHUB_CLIENT_ID!,
    clientSecret: process.env.GITHUB_CLIENT_SECRET!,
    callbackURL: process.env.GITHUB_CALLBACK_URL || '/api/auth/github/callback'
  },
  async (accessToken: string, refreshToken: string, profile: any, done: any) => {
    try {
      // Check if user already exists
      let user = await prisma.user.findUnique({
        where: { githubId: profile.id }
      });

      if (user) {
        // Update existing user with latest GitHub info
        user = await prisma.user.update({
          where: { id: user.id },
          data: {
            username: profile.username,
            email: profile.emails?.[0]?.value || user.email,
            avatarUrl: profile.photos?.[0]?.value,
            name: profile.displayName || profile.username,
            updatedAt: new Date()
          }
        });
      } else {
        // Create new user
        user = await prisma.user.create({
          data: {
            githubId: profile.id,
            username: profile.username,
            email: profile.emails?.[0]?.value || `${profile.username}@github.local`,
            avatarUrl: profile.photos?.[0]?.value,
            name: profile.displayName || profile.username
          }
        });

        // Create default profile
        await prisma.userProfile.create({
          data: {
            userId: user.id,
            experienceLevel: 'intermediate',
            careerGoals: []
          }
        });
      }

      return done(null, user);
    } catch (error) {
      console.error('GitHub OAuth error:', error);
      return done(error, null);
    }
  }));

  // JWT Strategy for API authentication
  passport.use(new JwtStrategy({
    jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
    secretOrKey: process.env.JWT_SECRET!,
    issuer: 'skillbridge-api',
    audience: 'skillbridge-app'
  },
  async (payload: any, done: any) => {
    try {
      const user = await prisma.user.findUnique({
        where: { id: payload.sub },
        include: {
          profile: true
        }
      });

      if (user) {
        return done(null, user);
      } else {
        return done(null, false);
      }
    } catch (error) {
      console.error('JWT authentication error:', error);
      return done(error, false);
    }
  }));

  // Serialize user for session
  passport.serializeUser((user: any, done) => {
    done(null, user.id);
  });

  // Deserialize user from session
  passport.deserializeUser(async (id: string, done) => {
    try {
      const user = await prisma.user.findUnique({
        where: { id },
        include: {
          profile: true
        }
      });
      done(null, user);
    } catch (error) {
      done(error, null);
    }
  });
}