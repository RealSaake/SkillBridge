import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { logUserAction } from '../utils/logger';

export const LandingPage: React.FC = () => {
  const [showDemo, setShowDemo] = useState(false);

  const handleCTAClick = (source: string) => {
    logUserAction('landing_cta_clicked', {
      source,
      timestamp: Date.now()
    });
  };

  const testimonials = [
    {
      name: "Sarah Chen",
      role: "Frontend Developer at Google",
      avatar: "👩‍💻",
      quote: "I shared my SkillBridge profile on LinkedIn and got 3 interview requests in one week! The professional presentation really makes a difference."
    },
    {
      name: "Marcus Rodriguez", 
      role: "Full Stack Engineer at Stripe",
      avatar: "👨‍💻",
      quote: "My SkillBridge profile became my go-to portfolio. I've shared it with recruiters, added it to my resume, and even use it in networking events."
    },
    {
      name: "Priya Patel",
      role: "Data Scientist at Netflix", 
      avatar: "👩‍🔬",
      quote: "The GitHub integration is incredible - it automatically showcased my ML projects. My profile has been viewed over 2,000 times and led to my dream job!"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Navigation */}
      <nav className="relative z-10 flex items-center justify-between p-6 lg:px-8">
        <div className="flex items-center">
          <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-xl">SB</span>
          </div>
          <span className="ml-3 text-white font-bold text-xl">SkillBridge</span>
        </div>
        <Link to="/login">
          <Button variant="outline" className="text-white border-white hover:bg-white hover:text-slate-900">
            Sign In
          </Button>
        </Link>
      </nav>

      {/* Hero Section */}
      <div className="relative isolate px-6 pt-14 lg:px-8">
        <div className="absolute inset-x-0 -top-40 -z-10 transform-gpu overflow-hidden blur-3xl sm:-top-80">
          <div className="relative left-[calc(50%-11rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 rotate-[30deg] bg-gradient-to-tr from-[#ff80b5] to-[#9089fc] opacity-30 sm:left-[calc(50%-30rem)] sm:w-[72.1875rem]"></div>
        </div>
        
        <div className="mx-auto max-w-5xl py-20 sm:py-32 lg:py-40">
          <div className="text-center">
            {/* Trust Badge */}
            <div className="flex items-center justify-center mb-8">
              <div className="flex items-center bg-white/10 backdrop-blur-sm rounded-full px-4 py-2 border border-white/20">
                <div className="flex -space-x-2 mr-3">
                  <div className="w-6 h-6 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full border-2 border-white"></div>
                  <div className="w-6 h-6 bg-gradient-to-r from-blue-400 to-cyan-400 rounded-full border-2 border-white"></div>
                  <div className="w-6 h-6 bg-gradient-to-r from-green-400 to-emerald-400 rounded-full border-2 border-white"></div>
                </div>
                <span className="text-white text-sm font-medium">Trusted by 10,000+ developers</span>
              </div>
            </div>

            <h1 className="text-4xl font-bold tracking-tight text-white sm:text-6xl lg:text-7xl">
              Create Your
              <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent"> Professional Developer Profile</span>
            </h1>
            <p className="mt-6 text-xl leading-8 text-gray-300 max-w-3xl mx-auto">
              Join thousands of developers showcasing their skills with <strong className="text-white">beautiful, shareable profiles</strong>. 
              Take our 2-minute quiz, get instant career insights, and create a profile that gets you noticed.
            </p>

            {/* Value Props */}
            <div className="mt-8 flex flex-wrap items-center justify-center gap-6 text-sm text-gray-300">
              <div className="flex items-center">
                <svg className="w-5 h-5 text-green-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                Beautiful shareable profiles
              </div>
              <div className="flex items-center">
                <svg className="w-5 h-5 text-green-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                Real GitHub integration
              </div>
              <div className="flex items-center">
                <svg className="w-5 h-5 text-green-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                Share on LinkedIn & Twitter
              </div>
            </div>

            <div className="mt-12 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link to="/login" onClick={() => handleCTAClick('hero-primary')}>
                <Button size="lg" className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-10 py-4 text-lg font-semibold shadow-2xl hover:shadow-purple-500/25 transition-all duration-300 transform hover:scale-105">
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  Create My Profile
                </Button>
              </Link>
              <Button 
                variant="outline" 
                size="lg" 
                className="text-white border-white hover:bg-white hover:text-slate-900 px-8 py-4 text-lg"
                onClick={() => setShowDemo(!showDemo)}
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                See Profile Examples
              </Button>
            </div>

            {/* Demo Preview */}
            {showDemo && (
              <div className="mt-12 max-w-4xl mx-auto">
                <Card className="bg-white/10 border-white/20 backdrop-blur-sm p-6">
                  <div className="text-left">
                    <h3 className="text-xl font-semibold text-white mb-4">🎯 Your Personalized Insight Preview</h3>
                    <div className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-lg p-6 border border-purple-300/30">
                      <div className="text-4xl mb-3">🚀</div>
                      <h4 className="text-lg font-semibold text-white mb-2">
                        "You're 85% ready for Senior Frontend Developer!"
                      </h4>
                      <p className="text-gray-300 mb-4">
                        Based on your React expertise and 12 repositories, you demonstrate strong technical skills. 
                        Focus on system design and TypeScript to become job-ready.
                      </p>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-400">Confidence Level</span>
                        <span className="text-sm text-white font-semibold">85%</span>
                      </div>
                      <div className="w-full bg-gray-700 rounded-full h-2 mt-2">
                        <div className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full" style={{width: '85%'}}></div>
                      </div>
                    </div>
                    <p className="text-center text-gray-400 mt-4 text-sm">
                      This is just a preview - your actual insights will be based on your real GitHub data!
                    </p>
                  </div>
                </Card>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Profile Showcase Section */}
      <div className="py-16 sm:py-24 bg-black/20">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Stand out with a professional developer profile
            </h2>
            <p className="mt-6 text-lg leading-8 text-gray-300">
              Join thousands of developers who are getting noticed with beautiful, shareable profiles
            </p>
          </div>
          
          {/* Profile Examples */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
            {/* Example Profile 1 */}
            <Card className="bg-white/10 border-white/20 backdrop-blur-sm hover:bg-white/15 transition-all duration-300 cursor-pointer group">
              <CardContent className="p-6">
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white font-bold">
                    SC
                  </div>
                  <div className="ml-3">
                    <h4 className="font-semibold text-white">Sarah Chen</h4>
                    <p className="text-sm text-gray-400">Senior Frontend Developer</p>
                  </div>
                  <div className="ml-auto">
                    <svg className="w-4 h-4 text-gray-400 group-hover:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </div>
                </div>
                <div className="space-y-2 mb-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-300">React</span>
                    <div className="flex items-center">
                      <div className="w-16 bg-gray-700 rounded-full h-2 mr-2">
                        <div className="bg-purple-500 h-2 rounded-full" style={{width: '90%'}}></div>
                      </div>
                      <span className="text-white text-xs">9/10</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-300">TypeScript</span>
                    <div className="flex items-center">
                      <div className="w-16 bg-gray-700 rounded-full h-2 mr-2">
                        <div className="bg-blue-500 h-2 rounded-full" style={{width: '85%'}}></div>
                      </div>
                      <span className="text-white text-xs">8.5/10</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between text-xs text-gray-400">
                  <span>42 repositories</span>
                  <span>1.2k profile views</span>
                </div>
              </CardContent>
            </Card>

            {/* Example Profile 2 */}
            <Card className="bg-white/10 border-white/20 backdrop-blur-sm hover:bg-white/15 transition-all duration-300 cursor-pointer group">
              <CardContent className="p-6">
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full flex items-center justify-center text-white font-bold">
                    MR
                  </div>
                  <div className="ml-3">
                    <h4 className="font-semibold text-white">Marcus Rodriguez</h4>
                    <p className="text-sm text-gray-400">Full Stack Engineer</p>
                  </div>
                  <div className="ml-auto">
                    <svg className="w-4 h-4 text-gray-400 group-hover:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </div>
                </div>
                <div className="space-y-2 mb-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-300">Node.js</span>
                    <div className="flex items-center">
                      <div className="w-16 bg-gray-700 rounded-full h-2 mr-2">
                        <div className="bg-green-500 h-2 rounded-full" style={{width: '95%'}}></div>
                      </div>
                      <span className="text-white text-xs">9.5/10</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-300">Python</span>
                    <div className="flex items-center">
                      <div className="w-16 bg-gray-700 rounded-full h-2 mr-2">
                        <div className="bg-yellow-500 h-2 rounded-full" style={{width: '80%'}}></div>
                      </div>
                      <span className="text-white text-xs">8/10</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between text-xs text-gray-400">
                  <span>67 repositories</span>
                  <span>890 profile views</span>
                </div>
              </CardContent>
            </Card>

            {/* Example Profile 3 */}
            <Card className="bg-white/10 border-white/20 backdrop-blur-sm hover:bg-white/15 transition-all duration-300 cursor-pointer group">
              <CardContent className="p-6">
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center text-white font-bold">
                    PP
                  </div>
                  <div className="ml-3">
                    <h4 className="font-semibold text-white">Priya Patel</h4>
                    <p className="text-sm text-gray-400">Data Scientist</p>
                  </div>
                  <div className="ml-auto">
                    <svg className="w-4 h-4 text-gray-400 group-hover:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </div>
                </div>
                <div className="space-y-2 mb-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-300">Machine Learning</span>
                    <div className="flex items-center">
                      <div className="w-16 bg-gray-700 rounded-full h-2 mr-2">
                        <div className="bg-orange-500 h-2 rounded-full" style={{width: '88%'}}></div>
                      </div>
                      <span className="text-white text-xs">8.8/10</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-300">Python</span>
                    <div className="flex items-center">
                      <div className="w-16 bg-gray-700 rounded-full h-2 mr-2">
                        <div className="bg-blue-500 h-2 rounded-full" style={{width: '92%'}}></div>
                      </div>
                      <span className="text-white text-xs">9.2/10</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between text-xs text-gray-400">
                  <span>28 repositories</span>
                  <span>2.1k profile views</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Viral Growth Stats */}
          <div className="text-center">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
              <div>
                <div className="text-2xl font-bold text-purple-400">15,000+</div>
                <div className="text-gray-400 text-sm">Profiles created</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-pink-400">2.3M</div>
                <div className="text-gray-400 text-sm">Profile views</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-blue-400">45,000+</div>
                <div className="text-gray-400 text-sm">Social shares</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-400">89%</div>
                <div className="text-gray-400 text-sm">Get job interviews</div>
              </div>
            </div>
            
            <Link to="/login" onClick={() => handleCTAClick('profile-showcase')}>
              <Button size="lg" className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-8 py-3 font-semibold">
                Create My Professional Profile
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Social Proof - Testimonials */}
      <div className="py-16 sm:py-24">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Developers love their career insights
            </h2>
            <p className="mt-6 text-lg leading-8 text-gray-300">
              See how SkillBridge helped thousands of developers discover their next career move
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="bg-white/10 border-white/20 backdrop-blur-sm hover:bg-white/15 transition-all duration-300">
                <CardContent className="p-6">
                  <div className="flex items-center mb-4">
                    <div className="text-3xl mr-3">{testimonial.avatar}</div>
                    <div>
                      <h4 className="font-semibold text-white">{testimonial.name}</h4>
                      <p className="text-sm text-gray-400">{testimonial.role}</p>
                    </div>
                  </div>
                  <p className="text-gray-300 italic">"{testimonial.quote}"</p>
                  <div className="flex mt-4">
                    {[...Array(5)].map((_, i) => (
                      <svg key={i} className="w-4 h-4 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
              From career insights to professional profile in minutes
            </h2>
            <p className="mt-6 text-lg leading-8 text-gray-300">
              Take our quiz, get instant insights, and automatically generate a beautiful profile you'll be proud to share
            </p>
          </div>
          
          <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-none">
            <dl className="grid max-w-xl grid-cols-1 gap-x-8 gap-y-16 lg:max-w-none lg:grid-cols-3">
              <div className="flex flex-col">
                <Card className="bg-white/10 border-white/20 backdrop-blur-sm hover:bg-white/15 transition-all duration-300 h-full">
                  <CardHeader>
                    <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center mb-4">
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                    <CardTitle className="text-white">Beautiful Professional Profile</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-300 mb-4">
                      Automatically generate a stunning profile showcasing your skills, projects, and career journey. Perfect for sharing with recruiters and networking.
                    </p>
                    <div className="text-sm text-purple-300 font-medium">
                      🎨 Ready to share instantly
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="flex flex-col">
                <Card className="bg-white/10 border-white/20 backdrop-blur-sm hover:bg-white/15 transition-all duration-300 h-full">
                  <CardHeader>
                    <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center mb-4">
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
                      </svg>
                    </div>
                    <CardTitle className="text-white">Multi-Platform Sharing</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-300 mb-4">
                      Share your profile on LinkedIn, Twitter, or anywhere with one click. Clean URLs, social previews, and mobile-optimized design.
                    </p>
                    <div className="text-sm text-blue-300 font-medium">
                      📱 Share everywhere instantly
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="flex flex-col">
                <Card className="bg-white/10 border-white/20 backdrop-blur-sm hover:bg-white/15 transition-all duration-300 h-full">
                  <CardHeader>
                    <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg flex items-center justify-center mb-4">
                      <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 0C4.477 0 0 4.484 0 10.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0110 4.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.203 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.942.359.31.678.921.678 1.856 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0020 10.017C20 4.484 15.522 0 10 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <CardTitle className="text-white">Real GitHub Integration</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-300 mb-4">
                      Automatically sync your repositories, languages, and contribution data. Your profile stays up-to-date with your latest work.
                    </p>
                    <div className="text-sm text-green-300 font-medium">
                      🔄 Always current and accurate
                    </div>
                  </CardContent>
                </Card>
              </div>
            </dl>
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="py-16 sm:py-24">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-3xl font-bold text-white">10,000+</div>
              <div className="text-gray-400 mt-2">Developers analyzed</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-white">95%</div>
              <div className="text-gray-400 mt-2">Find insights valuable</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-white">2 min</div>
              <div className="text-gray-400 mt-2">Average quiz time</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-white">100%</div>
              <div className="text-gray-400 mt-2">Free forever</div>
            </div>
          </div>
        </div>
      </div>

      {/* Final CTA Section */}
      <div className="relative isolate px-6 py-24 sm:py-32 lg:px-8">
        <div className="absolute inset-x-0 -top-40 -z-10 transform-gpu overflow-hidden blur-3xl sm:-top-80">
          <div className="relative left-[calc(50%-11rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 rotate-[30deg] bg-gradient-to-tr from-[#ff80b5] to-[#9089fc] opacity-20 sm:left-[calc(50%-30rem)] sm:w-[72.1875rem]"></div>
        </div>
        
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-4xl font-bold tracking-tight text-white sm:text-5xl">
            Create a profile that gets you noticed
          </h2>
          <p className="mx-auto mt-6 max-w-2xl text-xl leading-8 text-gray-300">
            Join thousands of developers who are landing interviews and advancing their careers with professional SkillBridge profiles.
          </p>
          
          {/* Trust indicators */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-6 text-sm text-gray-400">
            <div className="flex items-center">
              <svg className="w-4 h-4 text-green-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
              </svg>
              Secure GitHub OAuth
            </div>
            <div className="flex items-center">
              <svg className="w-4 h-4 text-green-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              No spam, ever
            </div>
            <div className="flex items-center">
              <svg className="w-4 h-4 text-green-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              Cancel anytime
            </div>
          </div>

          <div className="mt-12 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to="/login" onClick={() => handleCTAClick('final-cta')}>
              <Button size="lg" className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-12 py-4 text-xl font-semibold shadow-2xl hover:shadow-purple-500/25 transition-all duration-300 transform hover:scale-105">
                <svg className="w-6 h-6 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                Create My Professional Profile
              </Button>
            </Link>
          </div>
          
          <p className="mt-6 text-sm text-gray-500">
            2-minute setup • Beautiful shareable profile • 100% free forever
          </p>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-white/10">
        <div className="mx-auto max-w-7xl px-6 py-12 md:flex md:items-center md:justify-between lg:px-8">
          <div className="flex justify-center space-x-6 md:order-2">
            <p className="text-xs leading-5 text-gray-400">
              &copy; 2025 SkillBridge. All rights reserved.
            </p>
          </div>
          <div className="mt-8 md:order-1 md:mt-0">
            <div className="flex items-center justify-center md:justify-start">
              <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">SB</span>
              </div>
              <span className="ml-2 text-white font-semibold">SkillBridge</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};