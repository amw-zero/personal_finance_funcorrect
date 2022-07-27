#!/usr/bin/env sh

curl -XPOST -H "Content-Type: application/json" -d '{"name":"test3","amount":10.0,"recurrence_rule":"idk"}' localhost:3000/recurring_transactions