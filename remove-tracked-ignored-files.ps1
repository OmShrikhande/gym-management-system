# PowerShell script to remove tracked files that should be ignored

# First, commit the updated .gitignore
git add .gitignore
git commit -m "Update .gitignore with comprehensive rules"

# Remove files from Git tracking but keep them in the working directory
Write-Host "Removing tracked files that should be ignored from Git tracking..."

# Environment files
git rm --cached Backend/.env

# Package lock files
git rm --cached package-lock.json
git rm --cached Backend/package-lock.json

# Commit the changes
git commit -m "Remove tracked files that should be ignored"

# Push the changes to remote repository
Write-Host "You can now push these changes to your remote repository with:"
Write-Host "git push origin main"