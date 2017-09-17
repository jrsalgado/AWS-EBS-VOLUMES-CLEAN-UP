# AWS-EBS-VOLUMES-CLEAN-UP

This code will fetch all your CBS volumes and delete very volume except
- Those volumes created between the last 24 hours (according to the name)
- The last volume of each 15th day in the month

This script Use Node version 8

### Go to /config/default.json and replace your credentials
```json
{
  "AWS": {
    "config": {
      "accessKeyId": "REPLACE_ACCESS_KEY_ID",
      "secretAccessKey": "REPLACE_SECRET_ACCESS_KEY",
      "region": "us-west-1"
    }
  }
}
```

### To install dependencies and execute run on console
``` javascript
npm start
```

### If you have docker installed just
``` sh
docker-compose up
```

### Reports will be located at /reports directory
- Reports are created as csv files
- there are 3 reports, summary, deleted volumes and not deleted volumes