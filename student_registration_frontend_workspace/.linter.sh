#!/bin/bash
cd /home/kavia/workspace/code-generation/uniapply-portal-114629-794c1622/student_registration_frontend_workspace/student_registration_frontend
npm run build
EXIT_CODE=$?
if [ $EXIT_CODE -ne 0 ]; then
   exit 1
fi

