import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function setupStorageBuckets() {
  try {
    console.log('Creating rejection-attachments bucket...');
    
    // Create the bucket
    const { data: bucket, error: bucketError } = await supabase
      .storage
      .createBucket('rejection-attachments', {
        public: false,
        allowedMimeTypes: ['application/pdf', 'image/*', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
        fileSizeLimit: 100000000 // 100MB
      });

    if (bucketError) {
      if (bucketError.message.includes('already exists')) {
        console.log('Bucket already exists, updating policies...');
      } else {
        throw bucketError;
      }
    } else {
      console.log('Bucket created successfully');
    }

    // Update bucket policies
    const { error: policyError } = await supabase.rpc('create_storage_policy', {
      bucket_name: 'rejection-attachments',
      policy_name: 'Authenticated users can upload rejection attachments',
      definition: "bucket_id = 'rejection-attachments' AND auth.role() = 'authenticated'",
      operation: 'INSERT'
    });

    if (policyError) {
      console.error('Error creating upload policy:', policyError);
    }

    const { error: readPolicyError } = await supabase.rpc('create_storage_policy', {
      bucket_name: 'rejection-attachments',
      policy_name: 'Authenticated users can read rejection attachments',
      definition: "bucket_id = 'rejection-attachments' AND auth.role() = 'authenticated'",
      operation: 'SELECT'
    });

    if (readPolicyError) {
      console.error('Error creating read policy:', readPolicyError);
    }

    console.log('Storage bucket setup completed');

  } catch (error) {
    console.error('Error setting up storage bucket:', error);
  }
}

setupStorageBuckets();
