/**
 * Copyright 2016 Google Inc. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
'use strict';

const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp(functions.config().firebase);



exports.makeUppercase = functions.database.ref('/posts/{pushId}/original')
    .onWrite(event => {
      // Grab the current value of what was written to the Realtime Database.
      const original = event.data.val();
      console.log('Uppercasing', event.params.pushId, original);
      const uppercase = original.toUpperCase();
      // You must return a Promise when performing asynchronous tasks inside a Functions such as
      // writing to the Firebase Realtime Database.
      // Setting an "uppercase" sibling in the Realtime Database returns a Promise.
      return event.data.ref.parent.child('uppercase').set(uppercase);
});

// Keeps track of the length of the 'likes' child list in a separate property.
exports.countlikechange = functions.database.ref('/posts/{postid}/likes/{likeid}').onWrite(event => {
  const collectionRef = event.data.ref.parent;
  const countRef = collectionRef.parent.child('likes_count');

  console.log('event.data.val() = ' + event.data.val());
  console.log('event.eventType = ' + event.eventType);
  console.log('event.resource = ' + event.resource); 


  // Return the promise from countRef.transaction() so our function 
  // waits for this async event to complete before it exits.
  return countRef.transaction(current => {
    if (event.data.exists() && !event.data.previous.exists()) {
      return (current || 0) + 1;
    }
    else if (!event.data.exists() && event.data.previous.exists()) {
      return (current || 0) - 1;
    }
  }).then(() => {
    console.log('Counter updated.');
  });
});

// If the number of likes gets deleted, recount the number of likes
exports.recountlikes = functions.database.ref('/posts/{postid}/likes_count').onWrite(event => {

  console.log('data = ' + event.data);
  console.log('eventId = ' + event.eventId);
  console.log('eventType = ' + event.eventType);
  console.log('params = ' + event.params);
  console.log('timestamp = ' + event.timestamp);
  console.log('resource = ' + event.resource);


  console.log('ref = ' + event.data.ref);
  
 

  if (!event.data.exists()) {

    console.log('2');

    const counterRef = event.data.ref;
    const collectionRef = counterRef.parent.child('likes');
    
    console.log('3');
    // Return the promise from counterRef.set() so our function 
    // waits for this async event to complete before it exits.
    return collectionRef.once('value')
        .then(messagesData => counterRef.set(messagesData.numChildren()));
  }
});
