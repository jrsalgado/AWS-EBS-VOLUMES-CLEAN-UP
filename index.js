const fs = require('fs')
const jsonStringify = require('json-pretty')
const config = require('config')
const AWS = require('aws-sdk')
const Rx = require('rxjs')
const _ = require('lodash')
const moment = require('moment')
const json2csv = require('json2csv')

const Observable = Rx.Observable

AWS.config.update(config.get('AWS.config'));
const ec2 = new AWS.EC2()

const describeSnapshots = Observable
  .bindNodeCallback(ec2.describeSnapshots)
  .bind(ec2)

const deleteSnapshots = Observable
  .bindNodeCallback(ec2.deleteSnapshot)
  .bind(ec2)

// Fetch all snapshots
// in the future if instance id is known can fetch only related snapshots
const source = describeSnapshots({})

const snapshots = source
  .map(res => res.Snapshots)
  .flatMap(snapshots => Observable.from(snapshots))
  .filter(snapshot => !_.isEmpty(snapshot.Tags))

const now = moment()
const aDayBefore = moment(now).subtract(24, 'hours')

const beforeTodayNotFifthteen = snapshots
// if before 24 hours
  .filter(snapshot => {
    let snapshotTagName = _.find(snapshot.Tags, ['Key', 'Name'])
    let snapshotName = snapshotTagName.Value
    let snapshotTime = moment(snapshotName, '[backup_]YYYYMMDDHHmmss')
    return snapshotTime.isBefore(aDayBefore)
  })
  // if not on 15th day
  .filter(snapshot => {
    let snapshotTagName = _.find(snapshot.Tags, ['Key', 'Name'])
    let snapshotName = snapshotTagName.Value
    let snapshotTime = moment(snapshotName, '[backup_]YYYYMMDDHHmmss')

    return snapshotTime.date() !== 15
  })

const lastFromFifthteen = snapshots
  .filter(snapshot => {
    let snapshotTime = formatDate(snapshot)
    return snapshotTime.date() === 15
  })
  .groupBy(snapshot => {
    return formatDate(snapshot).month()
  })
  .flatMap(snapshots$ => {
    return snapshots$
      .reduce((acc, curr) => [...acc, curr], [])
      .map(monthSnapshots => {
        return _.orderBy(monthSnapshots, snapshot => {
          return formatDate(snapshot).toDate()
        }, ['desc'])
      })
      .flatMap(snapshot => snapshot)
      .skip(1)
  })

const observer = {
  next: (x) => {
    console.log(jsonStringify(x));
  },
  error: (err) => {
    console.log('Error: %s', err);
  },
  complete: () => {
    console.log('Completed');
  }
}


let snapshotsToDelete = Observable
  .concat(beforeTodayNotFifthteen, lastFromFifthteen)
  .flatMap(snapshot => deleteSnapshots({ SnapshotId: snapshot.SnapshotId, DryRun: false }), outer => outer)

const notDeleted = Observable
  .forkJoin(
    snapshots.toArray(),
    snapshotsToDelete.do(printDeleted).toArray()
  )
  .map(snapshots => {
    let notDeleted = _.difference(snapshots[0], snapshots[1], 'SnapshotId');
    let deleted = snapshots[1]
    let fetched = snapshots[0]

    return { notDeleted, deleted , fetched}
  })
  .do(printResume)
  .map(snapshots => snapshots.notDeleted)
  .filter(snapshots => !_.isEmpty(snapshots))
  .subscribe({
    next: printKeep,
    error: (err) => {
      console.log('Error: %s', err)
    }
  })


const fields = [{
    label: 'Name',
    value: row => _.get(row,'Tags[0].Value')
}, 'SnapshotId', 'OwnerId', 'StartTime', 'Description']

function printResume({ deleted, notDeleted, fetched }) {
  let data = { fetched: fetched.length, deleted: deleted.length, notDeleted: notDeleted.length };
  let resume = jsonStringify(data)
  let fields = ['fetched', 'deleted', 'notDeleted']
  let csv = json2csv({ data: data, fields })
  let filename = `./reports/resume-snapshots-${moment().toISOString()}.csv`

  fs.writeFile(filename, csv, function (err) {
    if (err) throw err;
    console.log(filename, 'Resume snapshots report created')
  })
}

function printDeleted(data) {
  let csv = json2csv({ data, fields })
  let filename = `./reports/deleted-snapshots-${moment().toISOString()}.csv`
  fs.writeFile(filename, csv, function (err) {
    if (err) throw err;
    console.log(filename, 'Deleted snapshots report created')
  })
}

function printKeep(data){
  let csv = json2csv({ data, fields })
  let filename = `./reports/keep-snapshots-${moment().toISOString()}.csv`
  fs.writeFile(filename, csv, function (err) {
    if (err) throw err;
    console.log(filename, 'Keep snapshots report created')
  })
}
function formatDate(snapshot) {
  let snapshotTagName = _.find(snapshot.Tags, ['Key', 'Name'])
  let snapshotName = snapshotTagName.Value
  return moment(snapshotName, '[backup_]YYYYMMDDHHmmss')
}

console.log('Processing EBS volumes...')