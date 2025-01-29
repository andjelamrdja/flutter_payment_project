const admin = require('firebase-admin')
const serviceAccount = require('../servicesAccountKey.json')

let db;
const fireBaseConnection = async () => {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        databaseURL: "https://identity-5de1f-default-rtdb.firebaseio.com"
      });
      console.log("Connected to Firebase");
      db = admin.database();
}

async function sendPushNotification(deviceToken, messageBody) {
    const message = {
        notification: {
            title: 'Your Notification Title',
            body: messageBody
        },
        token: deviceToken
    };

    try {
        const response = await admin.messaging().send(message);
        console.log('Successfully sent message:', response);
    } catch (error) {
        console.error('Error sending message:', error);
    }
}


module.exports = {fireBaseConnection, sendPushNotification, db};