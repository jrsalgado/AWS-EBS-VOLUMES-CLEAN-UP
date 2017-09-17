# AWS-EBS-VOLUMES-CLEAN-UP

<div style="text-align:center">
  <img src="https://media.giphy.com/media/ktcUyw6mBlMVa/giphy.gif"/>
</div>

This code will fetch all your CBS volumes and delete all volumes except:
- Those volumes created between the last 24 hours (according to the name)
- The last volume of each 15th day in the month


### Go to /config/default.json and replace your credentials
```json
{
  "AWS": {
    "config": {
      "accessKeyId": "REPLACE_ACCESS_KEY_ID",
      "secretAccessKey": "REPLACE_SECRET_ACCESS_KEY",
      "region": "REPLACE_AWS_REGION"
    }
  }
}
```

### To install dependencies and execute run on console
``` javascript
npm start
```

### If you prefer to use docker just clone and
``` sh
docker-compose up
```
### Reports will be located at /reports directory
- Reports are created as csv files
- there are 3 reports, summary, deleted volumes and not deleted volumes


## Just need to delete some snapshots


<div style="text-align:center">
  <img src="https://media.giphy.com/media/kjelbEcB3I33a/giphy.gif"/>
</div>


### If you have Docker installed just run the script replacing the enviroment variables and let the magic happen

``` bash
docker run -it --rm  -e ACCESS_KEY_ID=[REPLACE] -e SECRET_ACCESS_KEY=[REPLACE] -e AWS_REGION=[REPLACE] jsalgado/aws-ebs-cleanup:latest
```
