#!/bin/bash
cd /home/kavia/workspace/code-generation/uniapply-portal-114629-794c1622/student_registration_backend_workspace/student_registration_backend
source venv/bin/activate
flake8 .
LINT_EXIT_CODE=$?
if [ $LINT_EXIT_CODE -ne 0 ]; then
  exit 1
fi

