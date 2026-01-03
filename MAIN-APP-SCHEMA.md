Core Tables
1. organizations
The main organization entity:

Column	Type	Nullable	Default	Description
id	uuid	No	gen_random_uuid()	Primary key
name	text	No	-	Organization name
slug	text	No	-	URL-friendly identifier
timezone	text	No	'America/New_York'	Default timezone
compliance_mode	compliance_mode	No	'standard'	HACCP compliance level
logo_url	text	Yes	-	Organization logo
accent_color	text	Yes	'#0097a7'	Brand color
ttn_application_id	text	Yes	-	TTN app ID (legacy)
ttn_application_created	boolean	Yes	false	TTN status flag
ttn_webhook_configured	boolean	Yes	false	TTN webhook status
deleted_at	timestamptz	Yes	-	Soft delete timestamp
deleted_by	uuid	Yes	-	Who deleted
created_at	timestamptz	No	now()	Created timestamp
updated_at	timestamptz	No	now()	Updated timestamp
2. user_roles
Links users to organizations with their role (prevents privilege escalation):

Column	Type	Nullable	Default	Description
id	uuid	No	gen_random_uuid()	Primary key
user_id	uuid	No	-	References auth.users(id)
organization_id	uuid	No	-	References organizations(id)
role	app_role	No	-	User's role in the org
Role Enum (app_role):

owner - Full control, billing, can delete org
admin - Manage users, sites, sensors, settings
manager - Acknowledge alerts, edit temp limits, export reports
staff - Log temps, view alerts
viewer - Read-only access
inspector - External auditor with export access
3. profiles
Extended user profile data:

Column	Type	Nullable	Default	Description
user_id	uuid	No	-	Primary key, references auth.users(id)
email	text	Yes	-	User's email
full_name	text	Yes	-	Display name
phone	text	Yes	-	Phone for SMS alerts
avatar_url	text	Yes	-	Profile picture
organization_id	uuid	Yes	-	Current org context
site_id	uuid	Yes	-	Default site assignment
unit_id	uuid	Yes	-	Default unit assignment
notification_preferences	jsonb	Yes	-	Alert preferences
created_at	timestamptz	No	now()	-
updated_at	timestamptz	No	now()	-
Key Database Functions

-- Check if user has a specific role in an org
public.has_role(_user_id uuid, _org_id uuid, _role app_role) → boolean

-- Check if user belongs to an org (any role)
public.user_belongs_to_org(_user_id uuid, _org_id uuid) → boolean

-- Get user's organization ID from profile
public.get_user_org_id(_user_id uuid) → uuid

-- Create org and assign owner role atomically
public.create_organization_with_owner(p_name, p_slug, p_timezone, p_compliance_mode) → uuid
Entity Relationship Diagram

Entity Relationship
Permission Matrix by Role
Permission	owner	admin	manager	staff	viewer	inspector
Log temps	Yes	Yes	Yes	Yes	No	No
View alerts	Yes	Yes	Yes	Yes	Yes	Yes
Acknowledge alerts	Yes	Yes	Yes	No	No	No
Edit temp limits	Yes	Yes	Yes	No	No	No
Manage sites	Yes	Yes	No	No	No	No
Manage sensors	Yes	Yes	No	No	No	No
Manage users	Yes	Yes	No	No	No	No
Export reports	Yes	Yes	Yes	No	No	Yes
View audit logs	Yes	Yes	No	No	No	No
Delete entities	Yes	Yes	No	No	No	No
This schema is defined in src/hooks/useUserRole.ts and enforced via RLS policies in the database.