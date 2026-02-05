# Admin Reports & CS Management Guide

## Overview
The Reports & CS Management page allows administrators to handle user reports and customer service inquiries efficiently.

## Access
Navigate to: `/admin/reports`

**Requirements**: Admin role in the system

## Features

### 1. Reports Management

#### What are Reports?
Reports are user-submitted complaints about:
- **Shops**: False information, inappropriate content
- **Reviews**: Profanity, spam, misleading reviews
- **Users**: Spam accounts, harassment
- **Chats**: Inappropriate messages

#### Report Statuses
- **접수 (Pending)**: New report, awaiting review
- **검토중 (Reviewing)**: Under investigation
- **처리완료 (Resolved)**: Action taken, report closed
- **기각 (Dismissed)**: No action needed, report closed

#### How to Process a Report
1. Click the eye icon on any report to view details
2. Review the report information:
   - Reporter name and details
   - Target (what was reported)
   - Reason for reporting
   - Detailed description
3. For pending/reviewing reports:
   - Enter resolution notes in the text field
   - Click **처리 완료** to resolve OR **기각** to dismiss
4. The system automatically records:
   - Your admin ID as the resolver
   - Timestamp of resolution
   - Resolution notes

#### Filtering & Search
- **Status Filter**: Show only reports with specific status
- **Search**: Find reports by reporter name, target name, or reason

### 2. Customer Inquiries Management

#### What are Inquiries?
Customer service requests from:
- **Members**: Logged-in users (linked to profile)
- **Non-members**: Guests using phone number

#### Inquiry Categories
- **일반 (General)**: General questions
- **예약 (Reservation)**: Booking-related issues
- **결제 (Payment)**: Payment problems
- **기술 (Technical)**: Technical support
- **불만 (Complaint)**: Service complaints

#### Inquiry Statuses
- **대기 (Pending)**: New inquiry, no response yet
- **처리중 (In Progress)**: Being worked on
- **답변완료 (Resolved)**: Response sent to customer
- **종료 (Closed)**: Case closed

#### How to Respond to an Inquiry
1. Click the eye icon on any inquiry to view details
2. Review inquiry information:
   - Customer name and phone
   - Category
   - Subject and detailed content
   - Any previous responses
3. For pending/in-progress inquiries:
   - Enter your response in the text area
   - Click **답변 전송** to send
4. The system automatically:
   - Changes status to "Resolved"
   - Records your admin ID
   - Timestamps the response

#### Search
- Find inquiries by customer name, subject, or content

### 3. Dashboard Statistics

The top of the page shows real-time metrics:
- **전체 신고**: Total number of reports
- **처리 대기**: Reports pending or under review
- **전체 문의**: Total number of inquiries
- **답변 대기**: Inquiries pending or in progress

## Database Schema

### Reports Table
```sql
CREATE TABLE reports (
  id UUID PRIMARY KEY,
  reporter_id UUID REFERENCES profiles(id),
  target_type TEXT CHECK (target_type IN ('shop', 'review', 'user', 'chat')),
  target_id UUID,
  reason TEXT CHECK (reason IN ('profanity', 'false_info', 'spam', 'other')),
  description TEXT,
  evidence_urls TEXT[],
  status TEXT CHECK (status IN ('pending', 'reviewing', 'resolved', 'dismissed')),
  resolution TEXT,
  resolved_by UUID REFERENCES profiles(id),
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

### Customer Inquiries Table
```sql
CREATE TABLE customer_inquiries (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) -- NULL for non-members,
  user_name TEXT,
  user_phone TEXT,
  category TEXT CHECK (category IN ('general', 'reservation', 'payment', 'technical', 'complaint')),
  subject TEXT,
  content TEXT,
  attachments TEXT[],
  status TEXT CHECK (status IN ('pending', 'in_progress', 'resolved', 'closed')),
  response TEXT,
  responded_by UUID REFERENCES profiles(id),
  responded_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

## Security

### Row Level Security (RLS)
Both tables have RLS policies:

**Reports**:
- Users can view their own reports
- Admins can view and update all reports
- Only authenticated users can create reports

**Customer Inquiries**:
- Users can view their own inquiries
- Admins can view and update all inquiries
- Anyone (including non-members) can create inquiries

## Best Practices

### For Reports
1. **Review Promptly**: Check pending reports daily
2. **Be Thorough**: Investigate before resolving/dismissing
3. **Document Well**: Provide clear resolution notes
4. **Follow Up**: If action is taken (e.g., user suspension), reference the report ID

### For Inquiries
1. **Respond Quickly**: Aim to respond within 24 hours
2. **Be Professional**: Use courteous, clear language
3. **Provide Details**: Give specific answers with actionable steps
4. **Escalate When Needed**: Some inquiries may need technical team involvement

### General Tips
- Use the search function to find related reports/inquiries
- Track patterns (e.g., multiple reports on same user/shop)
- Keep resolution notes brief but informative
- Check statistics regularly to monitor workload

## Troubleshooting

### Reports Not Loading
1. Check browser console for errors
2. Verify your admin role in the database
3. Check Supabase connection status

### Can't Resolve Report
1. Ensure you have admin permissions
2. Check if report status allows resolution (only pending/reviewing)
3. Verify resolution notes are filled (for resolved status)

### Inquiry Response Not Sending
1. Ensure response text is not empty
2. Check if inquiry status is pending or in_progress
3. Verify network connection to Supabase

## API Endpoints (for developers)

### Fetch Reports
```typescript
const { data, error } = await supabase
  .from('reports')
  .select(`*, reporter:profiles!reporter_id(nickname, phone)`)
  .order('created_at', { ascending: false });
```

### Update Report Status
```typescript
await supabase
  .from('reports')
  .update({
    status: 'resolved',
    resolution: 'Resolution text here',
    resolved_by: adminUserId,
    resolved_at: new Date().toISOString(),
  })
  .eq('id', reportId);
```

### Fetch Inquiries
```typescript
const { data, error } = await supabase
  .from('customer_inquiries')
  .select(`*, user:profiles(nickname, phone)`)
  .order('created_at', { ascending: false });
```

### Respond to Inquiry
```typescript
await supabase
  .from('customer_inquiries')
  .update({
    status: 'resolved',
    response: 'Response text here',
    responded_by: adminUserId,
    responded_at: new Date().toISOString(),
  })
  .eq('id', inquiryId);
```

## Future Enhancements

Potential improvements for future versions:
- Email notifications when inquiries are answered
- Push notifications for urgent reports
- Analytics dashboard with charts and trends
- Bulk actions for multiple reports
- Attachment support for inquiries
- Internal notes/comments on reports
- Report escalation system
- Auto-assignment to admin staff
- SLA tracking and alerts

## Support

For technical issues or questions about this feature:
- Check the main documentation
- Review the Supabase integration guide
- Contact the development team
