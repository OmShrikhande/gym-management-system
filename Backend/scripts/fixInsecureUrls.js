/**
 * Script to find and fix insecure HTTP URLs in the settings database
 * This will convert HTTP URLs to HTTPS to prevent mixed content errors
 */

import mongoose from 'mongoose';
import Setting from '../src/models/Setting.js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || process.env.DATABASE_URL;

if (!MONGODB_URI) {
  console.error('❌ MongoDB URI not found in environment variables');
  process.exit(1);
}

/**
 * Validates and converts HTTP URLs to HTTPS
 */
const convertHttpToHttps = (url) => {
  if (!url || typeof url !== 'string') return url;
  
  // Skip if already HTTPS, relative, or data URL
  if (url.startsWith('https://') || url.startsWith('/') || url.startsWith('data:')) {
    return url;
  }
  
  // Convert HTTP to HTTPS
  if (url.startsWith('http://')) {
    console.log(`Converting: ${url} -> ${url.replace('http://', 'https://')}`);
    return url.replace('http://', 'https://');
  }
  
  return url;
};

/**
 * Main function to fix insecure URLs
 */
async function fixInsecureUrls() {
  try {
    console.log('🔗 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Find all settings with potential insecure URLs
    console.log('🔍 Searching for settings with URLs...');
    const settings = await Setting.find({
      $or: [
        { 'branding.logoUrl': { $regex: '^http://', $options: 'i' } },
        { 'branding.faviconUrl': { $regex: '^http://', $options: 'i' } }
      ]
    });

    console.log(`📊 Found ${settings.length} settings with potentially insecure URLs`);

    if (settings.length === 0) {
      console.log('✅ No insecure URLs found in the database');
      return;
    }

    let updatedCount = 0;
    const updates = [];

    for (const setting of settings) {
      let hasChanges = false;
      const originalSetting = JSON.parse(JSON.stringify(setting));

      // Check and fix logo URL
      if (setting.branding?.logoUrl) {
        const newLogoUrl = convertHttpToHttps(setting.branding.logoUrl);
        if (newLogoUrl !== setting.branding.logoUrl) {
          setting.branding.logoUrl = newLogoUrl;
          hasChanges = true;
        }
      }

      // Check and fix favicon URL
      if (setting.branding?.faviconUrl) {
        const newFaviconUrl = convertHttpToHttps(setting.branding.faviconUrl);
        if (newFaviconUrl !== setting.branding.faviconUrl) {
          setting.branding.faviconUrl = newFaviconUrl;
          hasChanges = true;
        }
      }

      if (hasChanges) {
        updates.push({
          settingId: setting._id,
          type: setting.isGlobal ? 'Global' : setting.gymId ? 'Gym' : 'User',
          gymId: setting.gymId,
          userId: setting.userId,
          changes: {
            logoUrl: {
              old: originalSetting.branding?.logoUrl,
              new: setting.branding?.logoUrl
            },
            faviconUrl: {
              old: originalSetting.branding?.faviconUrl,
              new: setting.branding?.faviconUrl
            }
          }
        });

        await setting.save();
        updatedCount++;
      }
    }

    console.log(`\n📝 Update Summary:`);
    console.log(`✅ Updated ${updatedCount} settings`);
    
    if (updates.length > 0) {
      console.log('\n🔧 Detailed Changes:');
      updates.forEach((update, index) => {
        console.log(`\n${index + 1}. ${update.type} Setting (ID: ${update.settingId})`);
        if (update.gymId) console.log(`   Gym ID: ${update.gymId}`);
        if (update.userId) console.log(`   User ID: ${update.userId}`);
        
        if (update.changes.logoUrl.old !== update.changes.logoUrl.new) {
          console.log(`   Logo URL: ${update.changes.logoUrl.old} -> ${update.changes.logoUrl.new}`);
        }
        if (update.changes.faviconUrl.old !== update.changes.faviconUrl.new) {
          console.log(`   Favicon URL: ${update.changes.faviconUrl.old} -> ${update.changes.faviconUrl.new}`);
        }
      });
    }

    // Verify the fixes
    console.log('\n🔍 Verifying fixes...');
    const remainingInsecure = await Setting.find({
      $or: [
        { 'branding.logoUrl': { $regex: '^http://', $options: 'i' } },
        { 'branding.faviconUrl': { $regex: '^http://', $options: 'i' } }
      ]
    });

    if (remainingInsecure.length === 0) {
      console.log('✅ All insecure URLs have been fixed!');
    } else {
      console.log(`⚠️  ${remainingInsecure.length} insecure URLs still remain`);
      remainingInsecure.forEach(setting => {
        console.log(`   Setting ID: ${setting._id}`);
        if (setting.branding?.logoUrl?.startsWith('http://')) {
          console.log(`     Logo URL: ${setting.branding.logoUrl}`);
        }
        if (setting.branding?.faviconUrl?.startsWith('http://')) {
          console.log(`     Favicon URL: ${setting.branding.faviconUrl}`);
        }
      });
    }

  } catch (error) {
    console.error('❌ Error fixing insecure URLs:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

// Run the script
console.log('🚀 Starting insecure URL fix script...');
fixInsecureUrls()
  .then(() => {
    console.log('✅ Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });