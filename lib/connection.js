/**
 * Created by Avery on 5/1/2016.
 */
function Connection(properties){

}


/**
 *     var connection = mysql.createConnection({
        host     : 'js-sql.cc10qvoaikvx.us-east-1.rds.amazonaws.com',
        user     : 'root',
        password : 'frostbytedev246813579',
        port     : process.env.RDS_PORT
    });

 connection.connect(function(err){
        if(err){
            console.log(err);
        }
    });

 connection.end();

 * @type {Connection}
 */

module.exports = Connection;
