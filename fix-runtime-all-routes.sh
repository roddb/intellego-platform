#!/bin/bash

# List of API routes that use auth() and need Node.js runtime
API_ROUTES=(
  "src/app/api/student/feedback/route.ts"
  "src/app/api/instructor/database-export/route.ts"
  "src/app/api/instructor/hierarchical/route.ts"
  "src/app/api/user/password/validate/route.ts"
  "src/app/api/user/password/change/route.ts"
  "src/app/api/instructor/reports/route.ts"
  "src/app/api/instructor/report/[reportId]/download/route.ts"
  "src/app/api/instructor/download/route.ts"
  "src/app/api/instructor/student/[studentId]/reports/route.ts"
  "src/app/api/instructor/hierarchy/route.ts"
  "src/app/api/security-test/route.ts"
  "src/app/api/admin/password/reset/route.ts"
  "src/app/api/weekly-reports/route.ts"
  "src/app/api/security-admin/route.ts"
)

# Add runtime configuration to each file
for file in "${API_ROUTES[@]}"; do
  if [ -f "$file" ]; then
    # Check if runtime is already configured
    if ! grep -q "export const runtime" "$file"; then
      echo "Adding runtime config to $file"
      
      # Find the last import line and add runtime config after it
      # Using a temporary file to avoid issues with sed on macOS
      awk '/^import/ { imports = imports $0 "\n" } 
           !/^import/ && !done { 
             if (imports) {
               print imports
               print ""
               print "// Configure to use Node.js runtime instead of Edge Runtime"
               print "// This is necessary because auth() uses bcryptjs which requires Node.js APIs"
               print "export const runtime = '\''nodejs'\'';"
               done = 1
             }
             print $0
           } 
           END { if (!done && imports) print imports }' "$file" > "$file.tmp"
      
      mv "$file.tmp" "$file"
    else
      echo "Runtime already configured in $file"
    fi
  else
    echo "File not found: $file"
  fi
done

echo "Runtime configuration complete!"