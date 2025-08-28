const { createClient } = require('@supabase/supabase-js');

async function checkDocumentStatus() {
  const supabase = createClient(
    '',
    ''
  );

  // Check document status
  const { data: document, error: docError } = await supabase
    .from('documents')
    .select('*')
    .eq('id', 'd7daab53-69b0-4652-add8-9de51ad28959')
    .single();
  
  if (docError) {
    console.error('Document Error:', docError);
  } else {
    console.log('Document:', JSON.stringify(document, null, 2));
  }

  // Check ALL workflows for this document (including completed ones)
  const { data: allWorkflows, error: workflowError } = await supabase
    .from('document_approval_workflows')
    .select('*')
    .eq('document_id', 'd7daab53-69b0-4652-add8-9de51ad28959')
    .order('created_at', { ascending: false });
  
  if (workflowError) {
    console.error('Workflow Error:', workflowError);
  } else {
    console.log('All Workflows:', JSON.stringify(allWorkflows, null, 2));
  }

  // Check activity logs
  const { data: logs, error: logsError } = await supabase
    .from('document_activity_logs')
    .select('*')
    .eq('document_id', 'd7daab53-69b0-4652-add8-9de51ad28959')
    .order('created_at', { ascending: false })
    .limit(10);
  
  if (logsError) {
    console.error('Logs Error:', logsError);
  } else {
    console.log('Recent Activity Logs:', JSON.stringify(logs, null, 2));
  }
}

checkDocumentStatus();
