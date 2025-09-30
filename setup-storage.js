import { createClient } from '@supabase/supabase-js'

// Supabase configuration
const supabaseUrl = 'https://ieuvqzaywgsifrfgagld.supabase.co'
const supabaseServiceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlldXZxemF5d2dzaWZyZmdhZ2xkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1ODg2ODY3NSwiZXhwIjoyMDc0NDQ0Njc1fQ.Gni2eIu7uojWhtFNU6osyAqivSbcb5fGwaDAhoK1yLs'

// Create Supabase client with service role key
const supabase = createClient(supabaseUrl, supabaseServiceRoleKey)

async function setupStorage() {
  console.log('🔧 Setting up Supabase Storage...')
  console.log('=' .repeat(50))

  try {
    // 1. Check existing buckets
    console.log('📋 Checking existing buckets...')
    const { data: buckets, error: listError } = await supabase.storage.listBuckets()
    
    if (listError) {
      console.error('❌ Error listing buckets:', listError.message)
    } else {
      console.log('✅ Existing buckets:')
      buckets?.forEach(bucket => {
        console.log(`   - ${bucket.name} (${bucket.public ? 'public' : 'private'})`)
      })
    }

    // 2. Create product-images bucket if it doesn't exist
    const bucketName = 'product-images'
    const bucketExists = buckets?.some(bucket => bucket.name === bucketName)
    
    if (!bucketExists) {
      console.log(`\n🛠️ Creating bucket: ${bucketName}`)
      const { data: bucket, error: createError } = await supabase.storage.createBucket(bucketName, {
        public: true,
        allowedMimeTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'],
        fileSizeLimit: 10485760 // 10MB
      })
      
      if (createError) {
        console.error('❌ Error creating bucket:', createError.message)
      } else {
        console.log('✅ Bucket created successfully!')
        console.log(`   Name: ${bucket.name}`)
        console.log(`   Public: ${bucket.public}`)
      }
    } else {
      console.log(`\n✅ Bucket '${bucketName}' already exists`)
    }

    // 3. Set up storage policies
    console.log('\n🔒 Setting up storage policies...')
    
    // Policy for public read access
    const { error: readPolicyError } = await supabase.rpc('create_policy_if_not_exists', {
      table_name: 'storage.objects',
      policy_name: 'Public read access for product-images',
      policy_definition: `bucket_id = '${bucketName}'`,
      policy_command: 'SELECT',
      policy_roles: 'public'
    })

    if (readPolicyError) {
      console.log('⚠️ Could not create read policy via RPC, trying manual approach...')
    } else {
      console.log('✅ Read policy created')
    }

    // Policy for insert access (for uploads)
    const { error: insertPolicyError } = await supabase.rpc('create_policy_if_not_exists', {
      table_name: 'storage.objects',
      policy_name: 'Public insert access for product-images',
      policy_definition: `bucket_id = '${bucketName}'`,
      policy_command: 'INSERT',
      policy_roles: 'public'
    })

    if (insertPolicyError) {
      console.log('⚠️ Could not create insert policy via RPC, trying manual approach...')
    } else {
      console.log('✅ Insert policy created')
    }

    // 4. Test upload
    console.log('\n🧪 Testing upload...')
    const testFile = new File(['test content'], 'test.txt', { type: 'text/plain' })
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(bucketName)
      .upload('test/test.txt', testFile)

    if (uploadError) {
      console.error('❌ Test upload failed:', uploadError.message)
    } else {
      console.log('✅ Test upload successful!')
      console.log(`   Path: ${uploadData.path}`)
      
      // Clean up test file
      await supabase.storage.from(bucketName).remove(['test/test.txt'])
      console.log('🧹 Test file cleaned up')
    }

    console.log('\n🎉 Storage setup complete!')
    console.log('You can now upload images to:', `https://ieuvqzaywgsifrfgagld.supabase.co/storage/v1/object/public/${bucketName}/`)

  } catch (error) {
    console.error('❌ Unexpected error:', error)
  }
}

// Run the setup
setupStorage()

