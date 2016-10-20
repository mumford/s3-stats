var AWS=require('aws-sdk'),
    async=require('async');

AWS.config.loadFromPath('./aws_config.json');

function LogDownloader() {
    var that = this;
    var s3;

    initializeAws();

    function initializeAws() {
        console.log('Initializing the AWS and S3 instances.');
        that.s3 = new AWS.S3({params:{Bucket:"incantations-podcast"}});
    }

    this.listAllLogs = function(cb) {
        getLoggingTarget(function(err, targetPrefix) {
            var fetchLogs = true;
            var logList;
            var continuationToken;

            async.whilst(
                function() { return fetchLogs; },
                function(logCallback) {
                    getLogList(targetPrefix, continuationToken, function(listErr, listData){
                        console.log('Logs fetched.');
                        continuationToken = listData.NextContinuationToken;
                        callback(null, continuationToken != null);
                    });
                },
                function(err, n) {
                    cb();
                }
            );

            getLogList(targetPrefix, null, function(listErr, listData) {
                
                console.log(listData.Content);
            });
        });
    }

    function getLoggingTarget(cb) {
        console.log('Checking for logging data to determine if it is enabled and where.');
        that.s3.getBucketLogging(function(err, data) {
            if (data && data.LoggingEnabled) {
                console.log('Logging is enabled and is targeting "' + 
                    data.LoggingEnabled.TargetPrefix + "'");

                cb(null, data.LoggingEnabled.TargetPrefix);
            } else if (data && !data.LoggingEnabled) {
                console.log('Logging is not enabled for this bucket.');
                cb('Logging not enabled');
            } else {
                cb(err);
            }
        })
    }

    function getLogList(targetPrefix, continuationToken, cb) {
        console.log('Getting log listings ' + 
            continuationToken ? ' with a continuation token' : ' without a continuation token');
        
        var params = {Prefix:targetPrefix};

        if (continuationToken) {
            params.ContinuationToken = continuationToken;
        }

        that.s3.listObjectsV2(params, function(err, data) {
            if (data) {
                cb(null, {Content:data.Contents, NextContinuationToken:data.NextContinuationToken});
            } else {
                console.log('Error listing log files:\n\n' + err);
                cb(err);
            }
        })
    }
}

LogDownloader.prototype.download = function() {
    console.log('Starting the download process.');
    this.listAllLogs(function(err, data) {
        if (err) {
            console.log('Error encountered:\n\n' + err);
        } else {
            console.log('Logs successfully listed.');
        }
    });
}

var downloader = new LogDownloader();

downloader.download();

/*s3LogsBucket.getBucketLogging(function(err, data) {    
    if (data && data.LoggingEnabled) {
        console.log(data);
        var targetPrefix = data.LoggingEnabled.TargetPrefix;

        console.log('Using target prefix "' + targetPrefix + "'");

        // List the objects in the logging target        
        s3LogsBucket.listObjectsV2({Prefix:targetPrefix}, function(logErr, logData) {
            if (logData) {
                console.log('We found the log data');
                console.log(logData);
            } else {
                console.log('Failed to list log data:\n\n' + logErr);
            }
        });
    } else {
        console.log('Failed to get logging for the bucket:\n\n' + err);
    }
});
*/