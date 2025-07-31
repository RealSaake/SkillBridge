#!/bin/bash

# Quick TypeScript fixes for deployment

echo "🔧 Fixing TypeScript compilation errors..."

# Fix auth route return types
sed -i '' 's/async (req, res) => {/async (req, res): Promise<void> => {/g' src/routes/auth.ts

# Fix dashboard route return types  
sed -i '' 's/async (req, res, next) => {/async (req, res, next): Promise<void> => {/g' src/routes/dashboard.ts

# Fix profiles route return types
sed -i '' 's/async (req, res, next) => {/async (req, res, next): Promise<void> => {/g' src/routes/profiles.ts

# Fix users route return types
sed -i '' 's/async (req, res) => {/async (req, res): Promise<void> => {/g' src/routes/users.ts

# Fix MCP route issues - add return statements
sed -i '' 's/} catch (error) {/} catch (error: any) {/g' src/routes/skills.ts

echo "✅ TypeScript fixes applied!"