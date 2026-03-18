import { db } from '../src/db/index';
import { users, products, orders, reviews, sessions, helpReports, chats, messages } from '../src/db/schema';

async function seedFromExport() {
    console.log('🌱 Seeding database from exported data...
');

    try {
        // Clear existing data first (in correct order due to foreign keys)
        console.log('🧹 Clearing existing data...');
        await db.delete(messages);
        await db.delete(reviews);
        await db.delete(helpReports);
        await db.delete(orders);
        await db.delete(chats);
        await db.delete(products);
        await db.delete(sessions);
        await db.delete(users);

        console.log('✅ Tables cleared!\n');

        // Insert exported data
        if (Object.keys([{"id":"2da3a3b4be0322be1fde012f23326f60","email":"farmer1@example.com","passwordHash":"$2b$10$35xrL6za3kKMTal8Ds9JgOLzARxqiQTdfH75f8begSejw1MER.d1W","name":"Rajesh Kumar","phone":"+91 98765 43210","location":"Ludhiana, Punjab","role":"farmer","isActive":true,"deliveryLocation":null,"latitude":30.901,"longitude":75.8573,"createdAt":"2026-03-08 08:20:04.241006+00"},{"id":"b41e86127d4e91fb99712ab452877bc1","email":"farmer2@example.com","passwordHash":"$2b$10$35xrL6za3kKMTal8Ds9JgOLzARxqiQTdfH75f8begSejw1MER.d1W","name":"Suresh Patel","phone":"+91 98765 43211","location":"Anand, Gujarat","role":"farmer","isActive":true,"deliveryLocation":null,"latitude":22.5645,"longitude":72.9289,"createdAt":"2026-03-08 08:20:04.241006+00"},{"id":"4d050f59fdb54ce65a5db49fb6140b96","email":"farmer3@example.com","passwordHash":"$2b$10$35xrL6za3kKMTal8Ds9JgOLzARxqiQTdfH75f8begSejw1MER.d1W","name":"Amit Singh","phone":"+91 98765 43212","location":"Karnal, Haryana","role":"farmer","isActive":true,"deliveryLocation":null,"latitude":29.6857,"longitude":76.9905,"createdAt":"2026-03-08 08:20:04.241006+00"},{"id":"e840bee9d295393d4c8137407d87498b","email":"farmer4@example.com","passwordHash":"$2b$10$35xrL6za3kKMTal8Ds9JgOLzARxqiQTdfH75f8begSejw1MER.d1W","name":"Neelima Reddy","phone":"+91 98765 43215","location":"Mysuru, Karnataka","role":"farmer","isActive":true,"deliveryLocation":null,"latitude":12.2958,"longitude":76.6394,"createdAt":"2026-03-08 08:20:04.241006+00"},{"id":"1998a136247be1863bb44ce372715577","email":"buyer1@example.com","passwordHash":"$2b$10$35xrL6za3kKMTal8Ds9JgOLzARxqiQTdfH75f8begSejw1MER.d1W","name":"Priya Sharma","phone":"+91 98765 43213","location":"New Delhi","role":"buyer","isActive":true,"deliveryLocation":"Connaught Place, New Delhi","latitude":28.6315,"longitude":77.2167,"createdAt":"2026-03-08 08:20:04.241006+00"},{"id":"a565a9b9f83f992404b5aaf754e07c46","email":"buyer2@example.com","passwordHash":"$2b$10$35xrL6za3kKMTal8Ds9JgOLzARxqiQTdfH75f8begSejw1MER.d1W","name":"Rahul Verma","phone":"+91 98765 43214","location":"Mumbai","role":"buyer","isActive":true,"deliveryLocation":"Andheri East, Mumbai","latitude":19.1136,"longitude":72.8697,"createdAt":"2026-03-08 08:20:04.241006+00"},{"id":"d8ee1c57ea79eb0fee58c7080cfa73f8","email":"buyer3@example.com","passwordHash":"$2b$10$35xrL6za3kKMTal8Ds9JgOLzARxqiQTdfH75f8begSejw1MER.d1W","name":"Kavya Nair","phone":"+91 98765 43216","location":"Bengaluru","role":"buyer","isActive":true,"deliveryLocation":"Indiranagar, Bengaluru","latitude":12.9716,"longitude":77.5946,"createdAt":"2026-03-08 08:20:04.241006+00"},{"id":"0b6bbf9a812c049cd805eabe03f13075","email":"admin@farmse.local","passwordHash":"$2b$10$35xrL6za3kKMTal8Ds9JgOLzARxqiQTdfH75f8begSejw1MER.d1W","name":"FarmSe Admin","phone":"+91 90000 00000","location":"HQ","role":"admin","isActive":true,"deliveryLocation":null,"latitude":null,"longitude":null,"createdAt":"2026-03-08 08:20:04.241006+00"},{"id":"5db1375d4608a65e36297ebd24377259","email":"farmer1@test.com","passwordHash":"$2b$10$15tk7yLfootosEnBbI3QT.1osMX1qe1isI8IWEhw7uVbZNODvGqWO","name":"Test Farmer","phone":"1234567890","location":"Mumbai","role":"farmer","isActive":true,"deliveryLocation":null,"latitude":19.076,"longitude":72.8777,"createdAt":"2026-03-09 14:34:08.060565+00"},{"id":"b705ac4a3f11ffbe0b3caee0c8518a10","email":"buyer1@test.com","passwordHash":"$2b$10$6mLyxHM3DAssUCLdj4zn6eUBlotL3hkYzod0tNZbfKe5hkterwx8W","name":"Test Buyer","phone":"9876543210","location":"Mumbai","role":"buyer","isActive":true,"deliveryLocation":null,"latitude":19.08,"longitude":72.88,"createdAt":"2026-03-09 14:34:55.753373+00"},{"id":"0a035d5eb21dba5921a6ec3135959f11","email":"kavinkannan00007@gmail.com","passwordHash":"$2b$10$BtjqHWVO86nndoj1Rf5PUuEzb5neimlink2snZj0h9xGwZihLyiS.","name":"vin","phone":"+917603807471","location":"Kaniyur Tiruppur District, Tamil Nadu, India","role":"buyer","isActive":true,"deliveryLocation":"3/154,Angalamman kovil street ,Devanurpudur","latitude":10.605023,"longitude":77.378096,"createdAt":"2026-03-10 05:08:46.165557+00"},{"id":"d2bde5bbfeede70fc9921bf05fd1867d","email":"farm@example.com","passwordHash":"$2b$10$3xztrAMI1f14Z7LJxqWJfOpvaD99Y30TiNwfkDGNC0kdvHwU1zgiK","name":"BaBa","phone":"9876543210","location":"Chennai, Tamil Nadu, India","role":"farmer","isActive":true,"deliveryLocation":null,"latitude":13.065156,"longitude":80.168682,"createdAt":"2026-03-10 14:43:50.872968+00"},{"id":"f12fe640d94fbc05d4ba78cb30804ec0","email":"gymravi555@gmail.com","passwordHash":"$2b$10$hvtJewjKTVNVRq4eT/zMnOEmwBhveJp5AUsES9ofCcR4YVOVZu/.q","name":"Bhuvan D","phone":"+919025480634","location":"","role":"buyer","isActive":true,"deliveryLocation":"11-A/5 S.V.R Colony, dadagapatty","latitude":null,"longitude":null,"createdAt":"2026-03-10 15:46:09.592651+00"},{"id":"1f4965fe9a2bfc931ec505463be8f0a5","email":"gymravi5555@gmail.com","passwordHash":"$2b$10$ht52CcfCb3L8T6ZVAsPkhOiRvBMSpwpSKlI9YQFeiTK8huIOZu99m","name":"Bhuvan D","phone":"+919025480634","location":"","role":"farmer","isActive":true,"deliveryLocation":null,"latitude":null,"longitude":null,"createdAt":"2026-03-10 15:46:50.953206+00"},{"id":"81a09a2e5f847da192e98da3ca12b29e","email":"farmer1@gmail.com","passwordHash":"$2b$10$I71LaxXzEygTrJ/vdKhjH.U52ojtN2Fq26rFUn9hJq/vMp5ppQiKG","name":"farmer1","phone":"9894254985","location":"Coimbatore, Tamil Nadu, India","role":"buyer","isActive":true,"deliveryLocation":"Bk pudur,Kuniyamuthur ","latitude":11.020016,"longitude":76.967467,"createdAt":"2026-03-10 15:49:10.587058+00"},{"id":"b63573355c4735d280297187d22fef56","email":"rajesh@example.com","passwordHash":"$2b$10$rAL8rHWRcoCrop29udeR.eqZSYwQQ8r9Aa5nQoSKJtG2qcarmhFPy","name":"Rajesh","phone":"+910000000000","location":"Kuniyamuthur High School, Coimbatore, Tamil Nadu, 641008, India","role":"farmer","isActive":true,"deliveryLocation":null,"latitude":10.9673,"longitude":76.9556,"createdAt":"2026-03-10 16:01:40.337798+00"},{"id":"181f19f4f8371d922998602e975ae72b","email":"suresh@example.com","passwordHash":"$2b$10$OlBwL61qN0dfI3p5bZLHrOTZY4ahgq7re2XwI03alWqNmiqmNLa1O","name":"Suresh","phone":"+910000000000","location":"R.S. Puram, Coimbatore, Tamil Nadu, 641002, India","role":"buyer","isActive":true,"deliveryLocation":"5, DB road","latitude":11.0101,"longitude":76.9504,"createdAt":"2026-03-10 16:05:00.848958+00"},{"id":"1a260b1e20e77ad15f6fea908890356a","email":"testfarmer1773160783047@test.com","passwordHash":"$2b$10$ER.n5m2UqnPl2Jme/xOou.mu49rjPVo6SEmVKJ3BJLcEAtAqDqqj.","name":"Test Farmer","phone":"9876500001","location":"Test Farm, Coimbatore","role":"farmer","isActive":true,"deliveryLocation":null,"latitude":11.0168,"longitude":76.9558,"createdAt":"2026-03-10 16:39:43.187162+00"},{"id":"8dcbd0f88d373e12dbbf0a9c0ccd32f4","email":"testbuyer1773160783047@test.com","passwordHash":"$2b$10$aDqq2x9vbDenF3Qnp88/yu1tdo8cKz2iUEFvW2Y3QpIkL9sEoKtnm","name":"Test Buyer","phone":"9876500002","location":"RS Puram, Coimbatore","role":"buyer","isActive":true,"deliveryLocation":null,"latitude":11.0108,"longitude":76.952,"createdAt":"2026-03-10 16:39:43.277839+00"},{"id":"20792fdc5da556da32aed88b7b1c00dc","email":"farbuyer1773160783047@test.com","passwordHash":"$2b$10$/p2aEgV7SIT5Xr2qHuqTnuR027jRovkHavfCODYX.j3ZQbi1dBHxm","name":"Far Buyer","phone":"9876500003","location":"Chennai","role":"buyer","isActive":true,"deliveryLocation":null,"latitude":13.0827,"longitude":80.2707,"createdAt":"2026-03-10 16:39:43.355198+00"},{"id":"a34fc8d0ba8890e72f896b755dcc86e3","email":"727723eucd044@skcet.ac.in","passwordHash":"$2b$10$Eqy1XeFDqh1oS6FN9opSEO66fU7Kb79TjxRu6x/ro4j8aJjqsxgr6","name":"Rohith","phone":"9489864740","location":"R.S. Puram, Coimbatore, Tamil Nadu, 641002, India","role":"buyer","isActive":true,"deliveryLocation":"5, DB road","latitude":11.0101,"longitude":76.9504,"createdAt":"2026-03-09 15:49:28.737956+00"},{"id":"7e2639d4676dbe50793fef27c027b2f1","email":"buyerone@gmail.com","passwordHash":"$2b$10$BjcwrBBDeJs14jHAAWs7Q.OnCr9zFaQLlums2uoiPYyYoxX.fsq5u","name":"buyerone","phone":"1234567890","location":"Coimbatore, Tamil Nadu, India","role":"buyer","isActive":true,"deliveryLocation":"Coimbatore,Bk Pudur","latitude":11.020016,"longitude":76.967467,"createdAt":"2026-03-10 17:12:12.144882+00"},{"id":"1f9ef2b0d772bf7a938aada09d95d41a","email":"farmerone@gmail.com","passwordHash":"$2b$10$aSZAh.DEdXBEeC3HhPNly.ejruMB.QwSI7MYE6XirbUSyiaNjw2Eu","name":"farmerone","phone":"1234567890","location":"Kovaipudur Bus Stand, Unnamed Road, T Block, S - Block, Kovaipudur, Coimbatore, Tamil Nadu, 641042, India","role":"farmer","isActive":true,"deliveryLocation":null,"latitude":10.947,"longitude":76.9324,"createdAt":"2026-03-10 17:16:27.397866+00"},{"id":"428e4b2230929ef243512a708b1cb03c","email":"mukesh@example.com","passwordHash":"$2b$10$ZdUao.QdAC8kN9G11iTKFeyW.xOpUzpj4Hqn4N0kQJoLqGWODjwRq","name":"Mukesh","phone":"9489864749","location":"SaiBaba Colony, Jawahar Nagar, SaiBaba Colony, Coimbatore, Tamil Nadu, 641011, India","role":"farmer","isActive":true,"deliveryLocation":null,"latitude":11.0237,"longitude":76.9452,"createdAt":"2026-03-10 17:52:25.706227+00"},{"id":"6345b08df9a83d089d1dada1293ea253","email":"raju@example.com","passwordHash":"$2b$10$iHwpb7ECIIMq88cSpFG88uwRRrmcqSTr2Re1BjlVOHwqmbMUTUVE2","name":"raju","phone":"0000000000","location":"Ukkadam Bus Stand, Ukkadam, Coimbatore, Tamil Nadu, 641001, India","role":"farmer","isActive":true,"deliveryLocation":null,"latitude":10.9886,"longitude":76.9616,"createdAt":"2026-03-11 03:22:39.208616+00"},{"id":"7b175d66a9f33cf52328be1eca9c71b4","email":"kavin@example.com","passwordHash":"$2b$10$FWw0iCrEh7wZPHKorTfTrePsVu/020q8yZvuLCRQLNU62tS/dH.4K","name":"kavin","phone":"0000000000","location":"Race Course, Coimbatore, Tamil Nadu, 641018, India","role":"farmer","isActive":true,"deliveryLocation":null,"latitude":10.9991,"longitude":76.9772,"createdAt":"2026-03-11 03:25:18.672722+00"}]).length > 0) {
            console.log('👤 Inserting users...');
            await db.insert(users).values([
  {
    "id": "2da3a3b4be0322be1fde012f23326f60",
    "email": "farmer1@example.com",
    "passwordHash": "$2b$10$35xrL6za3kKMTal8Ds9JgOLzARxqiQTdfH75f8begSejw1MER.d1W",
    "name": "Rajesh Kumar",
    "phone": "+91 98765 43210",
    "location": "Ludhiana, Punjab",
    "role": "farmer",
    "isActive": true,
    "deliveryLocation": null,
    "latitude": 30.901,
    "longitude": 75.8573,
    "createdAt": "2026-03-08 08:20:04.241006+00"
  },
  {
    "id": "b41e86127d4e91fb99712ab452877bc1",
    "email": "farmer2@example.com",
    "passwordHash": "$2b$10$35xrL6za3kKMTal8Ds9JgOLzARxqiQTdfH75f8begSejw1MER.d1W",
    "name": "Suresh Patel",
    "phone": "+91 98765 43211",
    "location": "Anand, Gujarat",
    "role": "farmer",
    "isActive": true,
    "deliveryLocation": null,
    "latitude": 22.5645,
    "longitude": 72.9289,
    "createdAt": "2026-03-08 08:20:04.241006+00"
  },
  {
    "id": "4d050f59fdb54ce65a5db49fb6140b96",
    "email": "farmer3@example.com",
    "passwordHash": "$2b$10$35xrL6za3kKMTal8Ds9JgOLzARxqiQTdfH75f8begSejw1MER.d1W",
    "name": "Amit Singh",
    "phone": "+91 98765 43212",
    "location": "Karnal, Haryana",
    "role": "farmer",
    "isActive": true,
    "deliveryLocation": null,
    "latitude": 29.6857,
    "longitude": 76.9905,
    "createdAt": "2026-03-08 08:20:04.241006+00"
  },
  {
    "id": "e840bee9d295393d4c8137407d87498b",
    "email": "farmer4@example.com",
    "passwordHash": "$2b$10$35xrL6za3kKMTal8Ds9JgOLzARxqiQTdfH75f8begSejw1MER.d1W",
    "name": "Neelima Reddy",
    "phone": "+91 98765 43215",
    "location": "Mysuru, Karnataka",
    "role": "farmer",
    "isActive": true,
    "deliveryLocation": null,
    "latitude": 12.2958,
    "longitude": 76.6394,
    "createdAt": "2026-03-08 08:20:04.241006+00"
  },
  {
    "id": "1998a136247be1863bb44ce372715577",
    "email": "buyer1@example.com",
    "passwordHash": "$2b$10$35xrL6za3kKMTal8Ds9JgOLzARxqiQTdfH75f8begSejw1MER.d1W",
    "name": "Priya Sharma",
    "phone": "+91 98765 43213",
    "location": "New Delhi",
    "role": "buyer",
    "isActive": true,
    "deliveryLocation": "Connaught Place, New Delhi",
    "latitude": 28.6315,
    "longitude": 77.2167,
    "createdAt": "2026-03-08 08:20:04.241006+00"
  },
  {
    "id": "a565a9b9f83f992404b5aaf754e07c46",
    "email": "buyer2@example.com",
    "passwordHash": "$2b$10$35xrL6za3kKMTal8Ds9JgOLzARxqiQTdfH75f8begSejw1MER.d1W",
    "name": "Rahul Verma",
    "phone": "+91 98765 43214",
    "location": "Mumbai",
    "role": "buyer",
    "isActive": true,
    "deliveryLocation": "Andheri East, Mumbai",
    "latitude": 19.1136,
    "longitude": 72.8697,
    "createdAt": "2026-03-08 08:20:04.241006+00"
  },
  {
    "id": "d8ee1c57ea79eb0fee58c7080cfa73f8",
    "email": "buyer3@example.com",
    "passwordHash": "$2b$10$35xrL6za3kKMTal8Ds9JgOLzARxqiQTdfH75f8begSejw1MER.d1W",
    "name": "Kavya Nair",
    "phone": "+91 98765 43216",
    "location": "Bengaluru",
    "role": "buyer",
    "isActive": true,
    "deliveryLocation": "Indiranagar, Bengaluru",
    "latitude": 12.9716,
    "longitude": 77.5946,
    "createdAt": "2026-03-08 08:20:04.241006+00"
  },
  {
    "id": "0b6bbf9a812c049cd805eabe03f13075",
    "email": "admin@farmse.local",
    "passwordHash": "$2b$10$35xrL6za3kKMTal8Ds9JgOLzARxqiQTdfH75f8begSejw1MER.d1W",
    "name": "FarmSe Admin",
    "phone": "+91 90000 00000",
    "location": "HQ",
    "role": "admin",
    "isActive": true,
    "deliveryLocation": null,
    "latitude": null,
    "longitude": null,
    "createdAt": "2026-03-08 08:20:04.241006+00"
  },
  {
    "id": "5db1375d4608a65e36297ebd24377259",
    "email": "farmer1@test.com",
    "passwordHash": "$2b$10$15tk7yLfootosEnBbI3QT.1osMX1qe1isI8IWEhw7uVbZNODvGqWO",
    "name": "Test Farmer",
    "phone": "1234567890",
    "location": "Mumbai",
    "role": "farmer",
    "isActive": true,
    "deliveryLocation": null,
    "latitude": 19.076,
    "longitude": 72.8777,
    "createdAt": "2026-03-09 14:34:08.060565+00"
  },
  {
    "id": "b705ac4a3f11ffbe0b3caee0c8518a10",
    "email": "buyer1@test.com",
    "passwordHash": "$2b$10$6mLyxHM3DAssUCLdj4zn6eUBlotL3hkYzod0tNZbfKe5hkterwx8W",
    "name": "Test Buyer",
    "phone": "9876543210",
    "location": "Mumbai",
    "role": "buyer",
    "isActive": true,
    "deliveryLocation": null,
    "latitude": 19.08,
    "longitude": 72.88,
    "createdAt": "2026-03-09 14:34:55.753373+00"
  },
  {
    "id": "0a035d5eb21dba5921a6ec3135959f11",
    "email": "kavinkannan00007@gmail.com",
    "passwordHash": "$2b$10$BtjqHWVO86nndoj1Rf5PUuEzb5neimlink2snZj0h9xGwZihLyiS.",
    "name": "vin",
    "phone": "+917603807471",
    "location": "Kaniyur Tiruppur District, Tamil Nadu, India",
    "role": "buyer",
    "isActive": true,
    "deliveryLocation": "3/154,Angalamman kovil street ,Devanurpudur",
    "latitude": 10.605023,
    "longitude": 77.378096,
    "createdAt": "2026-03-10 05:08:46.165557+00"
  },
  {
    "id": "d2bde5bbfeede70fc9921bf05fd1867d",
    "email": "farm@example.com",
    "passwordHash": "$2b$10$3xztrAMI1f14Z7LJxqWJfOpvaD99Y30TiNwfkDGNC0kdvHwU1zgiK",
    "name": "BaBa",
    "phone": "9876543210",
    "location": "Chennai, Tamil Nadu, India",
    "role": "farmer",
    "isActive": true,
    "deliveryLocation": null,
    "latitude": 13.065156,
    "longitude": 80.168682,
    "createdAt": "2026-03-10 14:43:50.872968+00"
  },
  {
    "id": "f12fe640d94fbc05d4ba78cb30804ec0",
    "email": "gymravi555@gmail.com",
    "passwordHash": "$2b$10$hvtJewjKTVNVRq4eT/zMnOEmwBhveJp5AUsES9ofCcR4YVOVZu/.q",
    "name": "Bhuvan D",
    "phone": "+919025480634",
    "location": "",
    "role": "buyer",
    "isActive": true,
    "deliveryLocation": "11-A/5 S.V.R Colony, dadagapatty",
    "latitude": null,
    "longitude": null,
    "createdAt": "2026-03-10 15:46:09.592651+00"
  },
  {
    "id": "1f4965fe9a2bfc931ec505463be8f0a5",
    "email": "gymravi5555@gmail.com",
    "passwordHash": "$2b$10$ht52CcfCb3L8T6ZVAsPkhOiRvBMSpwpSKlI9YQFeiTK8huIOZu99m",
    "name": "Bhuvan D",
    "phone": "+919025480634",
    "location": "",
    "role": "farmer",
    "isActive": true,
    "deliveryLocation": null,
    "latitude": null,
    "longitude": null,
    "createdAt": "2026-03-10 15:46:50.953206+00"
  },
  {
    "id": "81a09a2e5f847da192e98da3ca12b29e",
    "email": "farmer1@gmail.com",
    "passwordHash": "$2b$10$I71LaxXzEygTrJ/vdKhjH.U52ojtN2Fq26rFUn9hJq/vMp5ppQiKG",
    "name": "farmer1",
    "phone": "9894254985",
    "location": "Coimbatore, Tamil Nadu, India",
    "role": "buyer",
    "isActive": true,
    "deliveryLocation": "Bk pudur,Kuniyamuthur ",
    "latitude": 11.020016,
    "longitude": 76.967467,
    "createdAt": "2026-03-10 15:49:10.587058+00"
  },
  {
    "id": "b63573355c4735d280297187d22fef56",
    "email": "rajesh@example.com",
    "passwordHash": "$2b$10$rAL8rHWRcoCrop29udeR.eqZSYwQQ8r9Aa5nQoSKJtG2qcarmhFPy",
    "name": "Rajesh",
    "phone": "+910000000000",
    "location": "Kuniyamuthur High School, Coimbatore, Tamil Nadu, 641008, India",
    "role": "farmer",
    "isActive": true,
    "deliveryLocation": null,
    "latitude": 10.9673,
    "longitude": 76.9556,
    "createdAt": "2026-03-10 16:01:40.337798+00"
  },
  {
    "id": "181f19f4f8371d922998602e975ae72b",
    "email": "suresh@example.com",
    "passwordHash": "$2b$10$OlBwL61qN0dfI3p5bZLHrOTZY4ahgq7re2XwI03alWqNmiqmNLa1O",
    "name": "Suresh",
    "phone": "+910000000000",
    "location": "R.S. Puram, Coimbatore, Tamil Nadu, 641002, India",
    "role": "buyer",
    "isActive": true,
    "deliveryLocation": "5, DB road",
    "latitude": 11.0101,
    "longitude": 76.9504,
    "createdAt": "2026-03-10 16:05:00.848958+00"
  },
  {
    "id": "1a260b1e20e77ad15f6fea908890356a",
    "email": "testfarmer1773160783047@test.com",
    "passwordHash": "$2b$10$ER.n5m2UqnPl2Jme/xOou.mu49rjPVo6SEmVKJ3BJLcEAtAqDqqj.",
    "name": "Test Farmer",
    "phone": "9876500001",
    "location": "Test Farm, Coimbatore",
    "role": "farmer",
    "isActive": true,
    "deliveryLocation": null,
    "latitude": 11.0168,
    "longitude": 76.9558,
    "createdAt": "2026-03-10 16:39:43.187162+00"
  },
  {
    "id": "8dcbd0f88d373e12dbbf0a9c0ccd32f4",
    "email": "testbuyer1773160783047@test.com",
    "passwordHash": "$2b$10$aDqq2x9vbDenF3Qnp88/yu1tdo8cKz2iUEFvW2Y3QpIkL9sEoKtnm",
    "name": "Test Buyer",
    "phone": "9876500002",
    "location": "RS Puram, Coimbatore",
    "role": "buyer",
    "isActive": true,
    "deliveryLocation": null,
    "latitude": 11.0108,
    "longitude": 76.952,
    "createdAt": "2026-03-10 16:39:43.277839+00"
  },
  {
    "id": "20792fdc5da556da32aed88b7b1c00dc",
    "email": "farbuyer1773160783047@test.com",
    "passwordHash": "$2b$10$/p2aEgV7SIT5Xr2qHuqTnuR027jRovkHavfCODYX.j3ZQbi1dBHxm",
    "name": "Far Buyer",
    "phone": "9876500003",
    "location": "Chennai",
    "role": "buyer",
    "isActive": true,
    "deliveryLocation": null,
    "latitude": 13.0827,
    "longitude": 80.2707,
    "createdAt": "2026-03-10 16:39:43.355198+00"
  },
  {
    "id": "a34fc8d0ba8890e72f896b755dcc86e3",
    "email": "727723eucd044@skcet.ac.in",
    "passwordHash": "$2b$10$Eqy1XeFDqh1oS6FN9opSEO66fU7Kb79TjxRu6x/ro4j8aJjqsxgr6",
    "name": "Rohith",
    "phone": "9489864740",
    "location": "R.S. Puram, Coimbatore, Tamil Nadu, 641002, India",
    "role": "buyer",
    "isActive": true,
    "deliveryLocation": "5, DB road",
    "latitude": 11.0101,
    "longitude": 76.9504,
    "createdAt": "2026-03-09 15:49:28.737956+00"
  },
  {
    "id": "7e2639d4676dbe50793fef27c027b2f1",
    "email": "buyerone@gmail.com",
    "passwordHash": "$2b$10$BjcwrBBDeJs14jHAAWs7Q.OnCr9zFaQLlums2uoiPYyYoxX.fsq5u",
    "name": "buyerone",
    "phone": "1234567890",
    "location": "Coimbatore, Tamil Nadu, India",
    "role": "buyer",
    "isActive": true,
    "deliveryLocation": "Coimbatore,Bk Pudur",
    "latitude": 11.020016,
    "longitude": 76.967467,
    "createdAt": "2026-03-10 17:12:12.144882+00"
  },
  {
    "id": "1f9ef2b0d772bf7a938aada09d95d41a",
    "email": "farmerone@gmail.com",
    "passwordHash": "$2b$10$aSZAh.DEdXBEeC3HhPNly.ejruMB.QwSI7MYE6XirbUSyiaNjw2Eu",
    "name": "farmerone",
    "phone": "1234567890",
    "location": "Kovaipudur Bus Stand, Unnamed Road, T Block, S - Block, Kovaipudur, Coimbatore, Tamil Nadu, 641042, India",
    "role": "farmer",
    "isActive": true,
    "deliveryLocation": null,
    "latitude": 10.947,
    "longitude": 76.9324,
    "createdAt": "2026-03-10 17:16:27.397866+00"
  },
  {
    "id": "428e4b2230929ef243512a708b1cb03c",
    "email": "mukesh@example.com",
    "passwordHash": "$2b$10$ZdUao.QdAC8kN9G11iTKFeyW.xOpUzpj4Hqn4N0kQJoLqGWODjwRq",
    "name": "Mukesh",
    "phone": "9489864749",
    "location": "SaiBaba Colony, Jawahar Nagar, SaiBaba Colony, Coimbatore, Tamil Nadu, 641011, India",
    "role": "farmer",
    "isActive": true,
    "deliveryLocation": null,
    "latitude": 11.0237,
    "longitude": 76.9452,
    "createdAt": "2026-03-10 17:52:25.706227+00"
  },
  {
    "id": "6345b08df9a83d089d1dada1293ea253",
    "email": "raju@example.com",
    "passwordHash": "$2b$10$iHwpb7ECIIMq88cSpFG88uwRRrmcqSTr2Re1BjlVOHwqmbMUTUVE2",
    "name": "raju",
    "phone": "0000000000",
    "location": "Ukkadam Bus Stand, Ukkadam, Coimbatore, Tamil Nadu, 641001, India",
    "role": "farmer",
    "isActive": true,
    "deliveryLocation": null,
    "latitude": 10.9886,
    "longitude": 76.9616,
    "createdAt": "2026-03-11 03:22:39.208616+00"
  },
  {
    "id": "7b175d66a9f33cf52328be1eca9c71b4",
    "email": "kavin@example.com",
    "passwordHash": "$2b$10$FWw0iCrEh7wZPHKorTfTrePsVu/020q8yZvuLCRQLNU62tS/dH.4K",
    "name": "kavin",
    "phone": "0000000000",
    "location": "Race Course, Coimbatore, Tamil Nadu, 641018, India",
    "role": "farmer",
    "isActive": true,
    "deliveryLocation": null,
    "latitude": 10.9991,
    "longitude": 76.9772,
    "createdAt": "2026-03-11 03:25:18.672722+00"
  }
]);
        }

        if (Object.keys([{"id":"4f84e60c5c2743a59be946718fc503b2","farmerId":"2da3a3b4be0322be1fde012f23326f60","cropName":"Tomato","price":28,"quantity":340,"location":"Patiala, Punjab","image":"/produce/tomato.jpg","createdAt":"2026-03-08 08:20:04.248538+00"},{"id":"50cba432cb40fc14eaa0cb0d49780582","farmerId":"2da3a3b4be0322be1fde012f23326f60","cropName":"Spinach","price":22,"quantity":210,"location":"Ludhiana, Punjab","image":"/produce/spinach.jpg","createdAt":"2026-03-08 08:20:04.248538+00"},{"id":"2bf3262426bf3eccca07fb73cc3783c3","farmerId":"b41e86127d4e91fb99712ab452877bc1","cropName":"Potato","price":26,"quantity":500,"location":"Anand, Gujarat","image":"/produce/potato.jpg","createdAt":"2026-03-08 08:20:04.248538+00"},{"id":"33955082e99a432a261f98b86d89f6fb","farmerId":"b41e86127d4e91fb99712ab452877bc1","cropName":"Cucumber","price":32,"quantity":175,"location":"Junagadh, Gujarat","image":"/produce/cucumber.jpg","createdAt":"2026-03-08 08:20:04.248538+00"},{"id":"dcb9d83ef2ba7e3e27b699ae75f4aadd","farmerId":"4d050f59fdb54ce65a5db49fb6140b96","cropName":"Carrot","price":30,"quantity":165,"location":"Karnal, Haryana","image":"/produce/carrot.jpg","createdAt":"2026-03-08 08:20:04.248538+00"},{"id":"99270b4dac9152491babcc124cee988b","farmerId":"4d050f59fdb54ce65a5db49fb6140b96","cropName":"Okra","price":40,"quantity":190,"location":"Panipat, Haryana","image":"/produce/okra.jpg","createdAt":"2026-03-08 08:20:04.248538+00"},{"id":"b06e6f8f9a25ef71801b309f2456cb1b","farmerId":"4d050f59fdb54ce65a5db49fb6140b96","cropName":"Cabbage","price":24,"quantity":200,"location":"Sonipat, Haryana","image":"/produce/cabbage.jpg","createdAt":"2026-03-08 08:20:04.248538+00"},{"id":"7113106963309c018ee374da472e576c","farmerId":"e840bee9d295393d4c8137407d87498b","cropName":"Brinjal","price":36,"quantity":145,"location":"Mysuru, Karnataka","image":"/produce/brinjal.jpg","createdAt":"2026-03-08 08:20:04.248538+00"},{"id":"7a1ed92349b400facfc56a43ea3a54b3","farmerId":"e840bee9d295393d4c8137407d87498b","cropName":"Beans","price":34,"quantity":155,"location":"Mandya, Karnataka","image":"/produce/beans.jpg","createdAt":"2026-03-08 08:20:04.248538+00"},{"id":"64f7c0338d76d43fda1a6869b6cd1f94","farmerId":"e840bee9d295393d4c8137407d87498b","cropName":"Beetroot","price":29,"quantity":120,"location":"Mysuru, Karnataka","image":"/produce/beetroot.jpg","createdAt":"2026-03-08 08:20:04.248538+00"},{"id":"a1a820d105fc903719af531a65248f7b","farmerId":"2da3a3b4be0322be1fde012f23326f60","cropName":"Apple","price":110,"quantity":95,"location":"Ludhiana, Punjab","image":"/produce/apple.jpg","createdAt":"2026-03-08 08:20:04.248538+00"},{"id":"b06a70c8779054368e791e14968918fe","farmerId":"4d050f59fdb54ce65a5db49fb6140b96","cropName":"Orange","price":78,"quantity":130,"location":"Karnal, Haryana","image":"/produce/orange.jpg","createdAt":"2026-03-08 08:20:04.248538+00"},{"id":"1a08c5b3b9f1b5b7b27260ef6d6a0ebe","farmerId":"e840bee9d295393d4c8137407d87498b","cropName":"Grapes","price":96,"quantity":115,"location":"Mysuru, Karnataka","image":"/produce/grapes.jpg","createdAt":"2026-03-08 08:20:04.248538+00"},{"id":"c5570d16d31b9a6a22fecf7a0674abc1","farmerId":"b41e86127d4e91fb99712ab452877bc1","cropName":"Green Grapes","price":102,"quantity":108,"location":"Ahmedabad, Gujarat","image":"/produce/green-grapes.jpg","createdAt":"2026-03-08 08:20:04.248538+00"},{"id":"02f5486583da7d22821ae20d7ee83f4d","farmerId":"4d050f59fdb54ce65a5db49fb6140b96","cropName":"Strawberry","price":125,"quantity":84,"location":"Panipat, Haryana","image":"/produce/strawberry.jpg","createdAt":"2026-03-08 08:20:04.248538+00"},{"id":"28b1a37c14ff21a1ea5c984f8dd1caaa","farmerId":"e840bee9d295393d4c8137407d87498b","cropName":"Watermelon","price":42,"quantity":160,"location":"Mandya, Karnataka","image":"/produce/watermelon.jpg","createdAt":"2026-03-08 08:20:04.248538+00"},{"id":"7e27f190978ef709a502b98550ef0c29","farmerId":"2da3a3b4be0322be1fde012f23326f60","cropName":"Mosambi","price":72,"quantity":110,"location":"Patiala, Punjab","image":"/produce/mosambi.jpg","createdAt":"2026-03-08 08:20:04.248538+00"},{"id":"b17e04b204d7fdbfe7394e23113c6dd1","farmerId":"2da3a3b4be0322be1fde012f23326f60","cropName":"Lemon","price":60,"quantity":170,"location":"Ludhiana, Punjab","image":"/produce/lemon.avif","createdAt":"2026-03-08 08:20:04.248538+00"},{"id":"b9c5dd77feafe0f0655755c5fb8eaf94","farmerId":"5db1375d4608a65e36297ebd24377259","cropName":"Tomato","price":40,"quantity":100,"location":"Mumbai","image":"/produce/lemon.avif","createdAt":"2026-03-09 14:34:48.042018+00"},{"id":"b15d3927d8f640770eb1526733d37c01","farmerId":"2da3a3b4be0322be1fde012f23326f60","cropName":"Cauliflower","price":38,"quantity":149,"location":"Ludhiana, Punjab","image":"/produce/cauliflower.jpg","createdAt":"2026-03-08 08:20:04.248538+00"},{"id":"ef2790bc4c3d4d6207061984d6e22d21","farmerId":"b41e86127d4e91fb99712ab452877bc1","cropName":"Chilli","price":44,"quantity":129,"location":"Ahmedabad, Gujarat","image":"/produce/chilli.jpg","createdAt":"2026-03-08 08:20:04.248538+00"},{"id":"4d462a02f95a0ab9c14417431e4ad42b","farmerId":"b41e86127d4e91fb99712ab452877bc1","cropName":"Banana","price":55,"quantity":212,"location":"Anand, Gujarat","image":"/produce/banana.jpg","createdAt":"2026-03-08 08:20:04.248538+00"},{"id":"257575e796c43ca2e270a4cd2ce8ff97","farmerId":"d2bde5bbfeede70fc9921bf05fd1867d","cropName":"Tomato","price":50,"quantity":5,"location":"chennai","image":"/produce/tomato.jpg","createdAt":"2026-03-10 14:45:05.639149+00"},{"id":"fc025847f1619a8e4eab95007612e8b8","farmerId":"d2bde5bbfeede70fc9921bf05fd1867d","cropName":"watermelon","price":70,"quantity":20,"location":"chennai","image":"/produce/watermelon.jpg","createdAt":"2026-03-10 14:45:28.781148+00"},{"id":"3184ed51253c1b5b37f389a037b0a092","farmerId":"1a260b1e20e77ad15f6fea908890356a","cropName":"Tomato","price":45,"quantity":35,"location":"Test Farm, Coimbatore","image":"/produce/tomato.jpg","createdAt":"2026-03-10 16:39:43.523812+00"},{"id":"3d9c73a9295109b64973d5bd493447cb","farmerId":"7b175d66a9f33cf52328be1eca9c71b4","cropName":"banana","price":55,"quantity":8,"location":"Race Course, Coimbatore, Tamil Nadu, 641018, India","image":"/produce/banana.jpg","createdAt":"2026-03-11 03:26:04.929141+00"},{"id":"f347238e8e299c0efae5d2f7a0eb345b","farmerId":"b63573355c4735d280297187d22fef56","cropName":"Brinjal","price":20,"quantity":3,"location":"Kuniyamuthur High School, Coimbatore, Tamil Nadu, 641008, India","image":"b","createdAt":"2026-03-10 16:03:35.887695+00"},{"id":"ca29b59d3b367eb724eff55df57d1caf","farmerId":"428e4b2230929ef243512a708b1cb03c","cropName":"Capsicum","price":19.7,"quantity":19,"location":"SaiBaba Colony, Jawahar Nagar, SaiBaba Colony, Coimbatore, Tamil Nadu, 641011, India","image":"https://upload.wikimedia.org/wikipedia/commons/thumb/d/da/Red_capsicum_and_cross_section.jpg/330px-Red_capsicum_and_cross_section.jpg","createdAt":"2026-03-10 17:53:22.076305+00"},{"id":"0aa8cac5fce41f3fc919ce86ab60d6c3","farmerId":"6345b08df9a83d089d1dada1293ea253","cropName":"cucumber","price":22,"quantity":22,"location":"Ukkadam Bus Stand, Ukkadam, Coimbatore, Tamil Nadu, 641001, India","image":"/produce/cucumber.jpg","createdAt":"2026-03-11 03:23:18.682026+00"},{"id":"1c99ab07de8ee30c4bd4c0d227b8d543","farmerId":"6345b08df9a83d089d1dada1293ea253","cropName":"apple","price":60,"quantity":10,"location":"Ukkadam Bus Stand, Ukkadam, Coimbatore, Tamil Nadu, 641001, India","image":"/produce/apple.jpg","createdAt":"2026-03-11 03:23:44.302433+00"}]).length > 0) {
            console.log('🌾 Inserting products...');
            await db.insert(products).values([
  {
    "id": "4f84e60c5c2743a59be946718fc503b2",
    "farmerId": "2da3a3b4be0322be1fde012f23326f60",
    "cropName": "Tomato",
    "price": 28,
    "quantity": 340,
    "location": "Patiala, Punjab",
    "image": "/produce/tomato.jpg",
    "createdAt": "2026-03-08 08:20:04.248538+00"
  },
  {
    "id": "50cba432cb40fc14eaa0cb0d49780582",
    "farmerId": "2da3a3b4be0322be1fde012f23326f60",
    "cropName": "Spinach",
    "price": 22,
    "quantity": 210,
    "location": "Ludhiana, Punjab",
    "image": "/produce/spinach.jpg",
    "createdAt": "2026-03-08 08:20:04.248538+00"
  },
  {
    "id": "2bf3262426bf3eccca07fb73cc3783c3",
    "farmerId": "b41e86127d4e91fb99712ab452877bc1",
    "cropName": "Potato",
    "price": 26,
    "quantity": 500,
    "location": "Anand, Gujarat",
    "image": "/produce/potato.jpg",
    "createdAt": "2026-03-08 08:20:04.248538+00"
  },
  {
    "id": "33955082e99a432a261f98b86d89f6fb",
    "farmerId": "b41e86127d4e91fb99712ab452877bc1",
    "cropName": "Cucumber",
    "price": 32,
    "quantity": 175,
    "location": "Junagadh, Gujarat",
    "image": "/produce/cucumber.jpg",
    "createdAt": "2026-03-08 08:20:04.248538+00"
  },
  {
    "id": "dcb9d83ef2ba7e3e27b699ae75f4aadd",
    "farmerId": "4d050f59fdb54ce65a5db49fb6140b96",
    "cropName": "Carrot",
    "price": 30,
    "quantity": 165,
    "location": "Karnal, Haryana",
    "image": "/produce/carrot.jpg",
    "createdAt": "2026-03-08 08:20:04.248538+00"
  },
  {
    "id": "99270b4dac9152491babcc124cee988b",
    "farmerId": "4d050f59fdb54ce65a5db49fb6140b96",
    "cropName": "Okra",
    "price": 40,
    "quantity": 190,
    "location": "Panipat, Haryana",
    "image": "/produce/okra.jpg",
    "createdAt": "2026-03-08 08:20:04.248538+00"
  },
  {
    "id": "b06e6f8f9a25ef71801b309f2456cb1b",
    "farmerId": "4d050f59fdb54ce65a5db49fb6140b96",
    "cropName": "Cabbage",
    "price": 24,
    "quantity": 200,
    "location": "Sonipat, Haryana",
    "image": "/produce/cabbage.jpg",
    "createdAt": "2026-03-08 08:20:04.248538+00"
  },
  {
    "id": "7113106963309c018ee374da472e576c",
    "farmerId": "e840bee9d295393d4c8137407d87498b",
    "cropName": "Brinjal",
    "price": 36,
    "quantity": 145,
    "location": "Mysuru, Karnataka",
    "image": "/produce/brinjal.jpg",
    "createdAt": "2026-03-08 08:20:04.248538+00"
  },
  {
    "id": "7a1ed92349b400facfc56a43ea3a54b3",
    "farmerId": "e840bee9d295393d4c8137407d87498b",
    "cropName": "Beans",
    "price": 34,
    "quantity": 155,
    "location": "Mandya, Karnataka",
    "image": "/produce/beans.jpg",
    "createdAt": "2026-03-08 08:20:04.248538+00"
  },
  {
    "id": "64f7c0338d76d43fda1a6869b6cd1f94",
    "farmerId": "e840bee9d295393d4c8137407d87498b",
    "cropName": "Beetroot",
    "price": 29,
    "quantity": 120,
    "location": "Mysuru, Karnataka",
    "image": "/produce/beetroot.jpg",
    "createdAt": "2026-03-08 08:20:04.248538+00"
  },
  {
    "id": "a1a820d105fc903719af531a65248f7b",
    "farmerId": "2da3a3b4be0322be1fde012f23326f60",
    "cropName": "Apple",
    "price": 110,
    "quantity": 95,
    "location": "Ludhiana, Punjab",
    "image": "/produce/apple.jpg",
    "createdAt": "2026-03-08 08:20:04.248538+00"
  },
  {
    "id": "b06a70c8779054368e791e14968918fe",
    "farmerId": "4d050f59fdb54ce65a5db49fb6140b96",
    "cropName": "Orange",
    "price": 78,
    "quantity": 130,
    "location": "Karnal, Haryana",
    "image": "/produce/orange.jpg",
    "createdAt": "2026-03-08 08:20:04.248538+00"
  },
  {
    "id": "1a08c5b3b9f1b5b7b27260ef6d6a0ebe",
    "farmerId": "e840bee9d295393d4c8137407d87498b",
    "cropName": "Grapes",
    "price": 96,
    "quantity": 115,
    "location": "Mysuru, Karnataka",
    "image": "/produce/grapes.jpg",
    "createdAt": "2026-03-08 08:20:04.248538+00"
  },
  {
    "id": "c5570d16d31b9a6a22fecf7a0674abc1",
    "farmerId": "b41e86127d4e91fb99712ab452877bc1",
    "cropName": "Green Grapes",
    "price": 102,
    "quantity": 108,
    "location": "Ahmedabad, Gujarat",
    "image": "/produce/green-grapes.jpg",
    "createdAt": "2026-03-08 08:20:04.248538+00"
  },
  {
    "id": "02f5486583da7d22821ae20d7ee83f4d",
    "farmerId": "4d050f59fdb54ce65a5db49fb6140b96",
    "cropName": "Strawberry",
    "price": 125,
    "quantity": 84,
    "location": "Panipat, Haryana",
    "image": "/produce/strawberry.jpg",
    "createdAt": "2026-03-08 08:20:04.248538+00"
  },
  {
    "id": "28b1a37c14ff21a1ea5c984f8dd1caaa",
    "farmerId": "e840bee9d295393d4c8137407d87498b",
    "cropName": "Watermelon",
    "price": 42,
    "quantity": 160,
    "location": "Mandya, Karnataka",
    "image": "/produce/watermelon.jpg",
    "createdAt": "2026-03-08 08:20:04.248538+00"
  },
  {
    "id": "7e27f190978ef709a502b98550ef0c29",
    "farmerId": "2da3a3b4be0322be1fde012f23326f60",
    "cropName": "Mosambi",
    "price": 72,
    "quantity": 110,
    "location": "Patiala, Punjab",
    "image": "/produce/mosambi.jpg",
    "createdAt": "2026-03-08 08:20:04.248538+00"
  },
  {
    "id": "b17e04b204d7fdbfe7394e23113c6dd1",
    "farmerId": "2da3a3b4be0322be1fde012f23326f60",
    "cropName": "Lemon",
    "price": 60,
    "quantity": 170,
    "location": "Ludhiana, Punjab",
    "image": "/produce/lemon.avif",
    "createdAt": "2026-03-08 08:20:04.248538+00"
  },
  {
    "id": "b9c5dd77feafe0f0655755c5fb8eaf94",
    "farmerId": "5db1375d4608a65e36297ebd24377259",
    "cropName": "Tomato",
    "price": 40,
    "quantity": 100,
    "location": "Mumbai",
    "image": "/produce/lemon.avif",
    "createdAt": "2026-03-09 14:34:48.042018+00"
  },
  {
    "id": "b15d3927d8f640770eb1526733d37c01",
    "farmerId": "2da3a3b4be0322be1fde012f23326f60",
    "cropName": "Cauliflower",
    "price": 38,
    "quantity": 149,
    "location": "Ludhiana, Punjab",
    "image": "/produce/cauliflower.jpg",
    "createdAt": "2026-03-08 08:20:04.248538+00"
  },
  {
    "id": "ef2790bc4c3d4d6207061984d6e22d21",
    "farmerId": "b41e86127d4e91fb99712ab452877bc1",
    "cropName": "Chilli",
    "price": 44,
    "quantity": 129,
    "location": "Ahmedabad, Gujarat",
    "image": "/produce/chilli.jpg",
    "createdAt": "2026-03-08 08:20:04.248538+00"
  },
  {
    "id": "4d462a02f95a0ab9c14417431e4ad42b",
    "farmerId": "b41e86127d4e91fb99712ab452877bc1",
    "cropName": "Banana",
    "price": 55,
    "quantity": 212,
    "location": "Anand, Gujarat",
    "image": "/produce/banana.jpg",
    "createdAt": "2026-03-08 08:20:04.248538+00"
  },
  {
    "id": "257575e796c43ca2e270a4cd2ce8ff97",
    "farmerId": "d2bde5bbfeede70fc9921bf05fd1867d",
    "cropName": "Tomato",
    "price": 50,
    "quantity": 5,
    "location": "chennai",
    "image": "/produce/tomato.jpg",
    "createdAt": "2026-03-10 14:45:05.639149+00"
  },
  {
    "id": "fc025847f1619a8e4eab95007612e8b8",
    "farmerId": "d2bde5bbfeede70fc9921bf05fd1867d",
    "cropName": "watermelon",
    "price": 70,
    "quantity": 20,
    "location": "chennai",
    "image": "/produce/watermelon.jpg",
    "createdAt": "2026-03-10 14:45:28.781148+00"
  },
  {
    "id": "3184ed51253c1b5b37f389a037b0a092",
    "farmerId": "1a260b1e20e77ad15f6fea908890356a",
    "cropName": "Tomato",
    "price": 45,
    "quantity": 35,
    "location": "Test Farm, Coimbatore",
    "image": "/produce/tomato.jpg",
    "createdAt": "2026-03-10 16:39:43.523812+00"
  },
  {
    "id": "3d9c73a9295109b64973d5bd493447cb",
    "farmerId": "7b175d66a9f33cf52328be1eca9c71b4",
    "cropName": "banana",
    "price": 55,
    "quantity": 8,
    "location": "Race Course, Coimbatore, Tamil Nadu, 641018, India",
    "image": "/produce/banana.jpg",
    "createdAt": "2026-03-11 03:26:04.929141+00"
  },
  {
    "id": "f347238e8e299c0efae5d2f7a0eb345b",
    "farmerId": "b63573355c4735d280297187d22fef56",
    "cropName": "Brinjal",
    "price": 20,
    "quantity": 3,
    "location": "Kuniyamuthur High School, Coimbatore, Tamil Nadu, 641008, India",
    "image": "b",
    "createdAt": "2026-03-10 16:03:35.887695+00"
  },
  {
    "id": "ca29b59d3b367eb724eff55df57d1caf",
    "farmerId": "428e4b2230929ef243512a708b1cb03c",
    "cropName": "Capsicum",
    "price": 19.7,
    "quantity": 19,
    "location": "SaiBaba Colony, Jawahar Nagar, SaiBaba Colony, Coimbatore, Tamil Nadu, 641011, India",
    "image": "https://upload.wikimedia.org/wikipedia/commons/thumb/d/da/Red_capsicum_and_cross_section.jpg/330px-Red_capsicum_and_cross_section.jpg",
    "createdAt": "2026-03-10 17:53:22.076305+00"
  },
  {
    "id": "0aa8cac5fce41f3fc919ce86ab60d6c3",
    "farmerId": "6345b08df9a83d089d1dada1293ea253",
    "cropName": "cucumber",
    "price": 22,
    "quantity": 22,
    "location": "Ukkadam Bus Stand, Ukkadam, Coimbatore, Tamil Nadu, 641001, India",
    "image": "/produce/cucumber.jpg",
    "createdAt": "2026-03-11 03:23:18.682026+00"
  },
  {
    "id": "1c99ab07de8ee30c4bd4c0d227b8d543",
    "farmerId": "6345b08df9a83d089d1dada1293ea253",
    "cropName": "apple",
    "price": 60,
    "quantity": 10,
    "location": "Ukkadam Bus Stand, Ukkadam, Coimbatore, Tamil Nadu, 641001, India",
    "image": "/produce/apple.jpg",
    "createdAt": "2026-03-11 03:23:44.302433+00"
  }
]);
        }

        if (Object.keys([{"id":"5678f05f6e463025349b856d97bb64bf","productId":"4f84e60c5c2743a59be946718fc503b2","farmerId":"2da3a3b4be0322be1fde012f23326f60","buyerId":"1998a136247be1863bb44ce372715577","quantity":20,"totalPrice":560,"deliveryMethod":"farmer_delivery","paymentMethod":"upi","paymentStatus":"completed","orderStatus":"delivered","createdAt":"2026-03-08 08:20:04.256444+00"},{"id":"002e14da5315ed12f1109f888cc3362c","productId":"c5570d16d31b9a6a22fecf7a0674abc1","farmerId":"b41e86127d4e91fb99712ab452877bc1","buyerId":"a565a9b9f83f992404b5aaf754e07c46","quantity":12,"totalPrice":1224,"deliveryMethod":"buyer_pickup","paymentMethod":"bank_transfer","paymentStatus":"pending","orderStatus":"pending","createdAt":"2026-03-08 08:20:04.256444+00"},{"id":"10371da6852a0a4b38745f4e80339bd5","productId":"99270b4dac9152491babcc124cee988b","farmerId":"4d050f59fdb54ce65a5db49fb6140b96","buyerId":"1998a136247be1863bb44ce372715577","quantity":8,"totalPrice":320,"deliveryMethod":"local_transport","paymentMethod":"upi","paymentStatus":"completed","orderStatus":"accepted","createdAt":"2026-03-08 08:20:04.256444+00"},{"id":"9cb7f6f6dc3c63f2bf3f287be4fc72b7","productId":"28b1a37c14ff21a1ea5c984f8dd1caaa","farmerId":"e840bee9d295393d4c8137407d87498b","buyerId":"d8ee1c57ea79eb0fee58c7080cfa73f8","quantity":5,"totalPrice":210,"deliveryMethod":"farmer_delivery","paymentMethod":"bank_transfer","paymentStatus":"completed","orderStatus":"rejected","createdAt":"2026-03-08 08:20:04.256444+00"},{"id":"ba2f7eed3b3c56d32ff0f2d21918bae7","productId":"4d462a02f95a0ab9c14417431e4ad42b","farmerId":"b41e86127d4e91fb99712ab452877bc1","buyerId":"d8ee1c57ea79eb0fee58c7080cfa73f8","quantity":18,"totalPrice":990,"deliveryMethod":"buyer_pickup","paymentMethod":"upi","paymentStatus":"completed","orderStatus":"completed","createdAt":"2026-03-08 08:20:04.256444+00"},{"id":"597e1e4162ce7015ca349a56a4730e5e","productId":"b15d3927d8f640770eb1526733d37c01","farmerId":"2da3a3b4be0322be1fde012f23326f60","buyerId":"a34fc8d0ba8890e72f896b755dcc86e3","quantity":1,"totalPrice":38,"deliveryMethod":"buyer_pickup","paymentMethod":"upi","paymentStatus":"completed","orderStatus":"pending","createdAt":"2026-03-09 15:56:30.121261+00"},{"id":"d3cbe5947f400e45f7bc6d3ccf70ff53","productId":"ef2790bc4c3d4d6207061984d6e22d21","farmerId":"b41e86127d4e91fb99712ab452877bc1","buyerId":"a34fc8d0ba8890e72f896b755dcc86e3","quantity":1,"totalPrice":44,"deliveryMethod":"buyer_pickup","paymentMethod":"upi","paymentStatus":"completed","orderStatus":"pending","createdAt":"2026-03-09 15:56:32.806847+00"},{"id":"8f7b83763910ecdbb61b49e7c46a3807","productId":"4d462a02f95a0ab9c14417431e4ad42b","farmerId":"b41e86127d4e91fb99712ab452877bc1","buyerId":"0a035d5eb21dba5921a6ec3135959f11","quantity":8,"totalPrice":440,"deliveryMethod":"buyer_pickup","paymentMethod":"upi","paymentStatus":"completed","orderStatus":"pending","createdAt":"2026-03-10 05:09:12.904688+00"},{"id":"ea8674c5ece9449ff8e740de35484a3b","productId":"3184ed51253c1b5b37f389a037b0a092","farmerId":"1a260b1e20e77ad15f6fea908890356a","buyerId":"8dcbd0f88d373e12dbbf0a9c0ccd32f4","quantity":5,"totalPrice":225,"deliveryMethod":"buyer_pickup","paymentMethod":"cash_on_delivery","paymentStatus":"completed","orderStatus":"completed","createdAt":"2026-03-10 16:39:43.981511+00"},{"id":"0201ed6b19c8a61bbcd2c6d5e9ab3023","productId":"ca29b59d3b367eb724eff55df57d1caf","farmerId":"428e4b2230929ef243512a708b1cb03c","buyerId":"a34fc8d0ba8890e72f896b755dcc86e3","quantity":1,"totalPrice":19.7,"deliveryMethod":"buyer_pickup","paymentMethod":"upi","paymentStatus":"completed","orderStatus":"accepted","createdAt":"2026-03-10 17:53:59.212677+00"},{"id":"505b3ff326824bcf2dda50024c4706b8","productId":"3d9c73a9295109b64973d5bd493447cb","farmerId":"7b175d66a9f33cf52328be1eca9c71b4","buyerId":"a34fc8d0ba8890e72f896b755dcc86e3","quantity":1,"totalPrice":55,"deliveryMethod":"buyer_pickup","paymentMethod":"upi","paymentStatus":"completed","orderStatus":"accepted","createdAt":"2026-03-11 03:28:45.044048+00"},{"id":"e55bd237b0cfe2ee5ddbc487c7185020","productId":"f347238e8e299c0efae5d2f7a0eb345b","farmerId":"b63573355c4735d280297187d22fef56","buyerId":"a34fc8d0ba8890e72f896b755dcc86e3","quantity":2,"totalPrice":40,"deliveryMethod":"buyer_pickup","paymentMethod":"upi","paymentStatus":"completed","orderStatus":"pending","createdAt":"2026-03-17 06:14:16.112734+00"}]).length > 0) {
            console.log('📦 Inserting orders...');
            await db.insert(orders).values([
  {
    "id": "5678f05f6e463025349b856d97bb64bf",
    "productId": "4f84e60c5c2743a59be946718fc503b2",
    "farmerId": "2da3a3b4be0322be1fde012f23326f60",
    "buyerId": "1998a136247be1863bb44ce372715577",
    "quantity": 20,
    "totalPrice": 560,
    "deliveryMethod": "farmer_delivery",
    "paymentMethod": "upi",
    "paymentStatus": "completed",
    "orderStatus": "delivered",
    "createdAt": "2026-03-08 08:20:04.256444+00"
  },
  {
    "id": "002e14da5315ed12f1109f888cc3362c",
    "productId": "c5570d16d31b9a6a22fecf7a0674abc1",
    "farmerId": "b41e86127d4e91fb99712ab452877bc1",
    "buyerId": "a565a9b9f83f992404b5aaf754e07c46",
    "quantity": 12,
    "totalPrice": 1224,
    "deliveryMethod": "buyer_pickup",
    "paymentMethod": "bank_transfer",
    "paymentStatus": "pending",
    "orderStatus": "pending",
    "createdAt": "2026-03-08 08:20:04.256444+00"
  },
  {
    "id": "10371da6852a0a4b38745f4e80339bd5",
    "productId": "99270b4dac9152491babcc124cee988b",
    "farmerId": "4d050f59fdb54ce65a5db49fb6140b96",
    "buyerId": "1998a136247be1863bb44ce372715577",
    "quantity": 8,
    "totalPrice": 320,
    "deliveryMethod": "local_transport",
    "paymentMethod": "upi",
    "paymentStatus": "completed",
    "orderStatus": "accepted",
    "createdAt": "2026-03-08 08:20:04.256444+00"
  },
  {
    "id": "9cb7f6f6dc3c63f2bf3f287be4fc72b7",
    "productId": "28b1a37c14ff21a1ea5c984f8dd1caaa",
    "farmerId": "e840bee9d295393d4c8137407d87498b",
    "buyerId": "d8ee1c57ea79eb0fee58c7080cfa73f8",
    "quantity": 5,
    "totalPrice": 210,
    "deliveryMethod": "farmer_delivery",
    "paymentMethod": "bank_transfer",
    "paymentStatus": "completed",
    "orderStatus": "rejected",
    "createdAt": "2026-03-08 08:20:04.256444+00"
  },
  {
    "id": "ba2f7eed3b3c56d32ff0f2d21918bae7",
    "productId": "4d462a02f95a0ab9c14417431e4ad42b",
    "farmerId": "b41e86127d4e91fb99712ab452877bc1",
    "buyerId": "d8ee1c57ea79eb0fee58c7080cfa73f8",
    "quantity": 18,
    "totalPrice": 990,
    "deliveryMethod": "buyer_pickup",
    "paymentMethod": "upi",
    "paymentStatus": "completed",
    "orderStatus": "completed",
    "createdAt": "2026-03-08 08:20:04.256444+00"
  },
  {
    "id": "597e1e4162ce7015ca349a56a4730e5e",
    "productId": "b15d3927d8f640770eb1526733d37c01",
    "farmerId": "2da3a3b4be0322be1fde012f23326f60",
    "buyerId": "a34fc8d0ba8890e72f896b755dcc86e3",
    "quantity": 1,
    "totalPrice": 38,
    "deliveryMethod": "buyer_pickup",
    "paymentMethod": "upi",
    "paymentStatus": "completed",
    "orderStatus": "pending",
    "createdAt": "2026-03-09 15:56:30.121261+00"
  },
  {
    "id": "d3cbe5947f400e45f7bc6d3ccf70ff53",
    "productId": "ef2790bc4c3d4d6207061984d6e22d21",
    "farmerId": "b41e86127d4e91fb99712ab452877bc1",
    "buyerId": "a34fc8d0ba8890e72f896b755dcc86e3",
    "quantity": 1,
    "totalPrice": 44,
    "deliveryMethod": "buyer_pickup",
    "paymentMethod": "upi",
    "paymentStatus": "completed",
    "orderStatus": "pending",
    "createdAt": "2026-03-09 15:56:32.806847+00"
  },
  {
    "id": "8f7b83763910ecdbb61b49e7c46a3807",
    "productId": "4d462a02f95a0ab9c14417431e4ad42b",
    "farmerId": "b41e86127d4e91fb99712ab452877bc1",
    "buyerId": "0a035d5eb21dba5921a6ec3135959f11",
    "quantity": 8,
    "totalPrice": 440,
    "deliveryMethod": "buyer_pickup",
    "paymentMethod": "upi",
    "paymentStatus": "completed",
    "orderStatus": "pending",
    "createdAt": "2026-03-10 05:09:12.904688+00"
  },
  {
    "id": "ea8674c5ece9449ff8e740de35484a3b",
    "productId": "3184ed51253c1b5b37f389a037b0a092",
    "farmerId": "1a260b1e20e77ad15f6fea908890356a",
    "buyerId": "8dcbd0f88d373e12dbbf0a9c0ccd32f4",
    "quantity": 5,
    "totalPrice": 225,
    "deliveryMethod": "buyer_pickup",
    "paymentMethod": "cash_on_delivery",
    "paymentStatus": "completed",
    "orderStatus": "completed",
    "createdAt": "2026-03-10 16:39:43.981511+00"
  },
  {
    "id": "0201ed6b19c8a61bbcd2c6d5e9ab3023",
    "productId": "ca29b59d3b367eb724eff55df57d1caf",
    "farmerId": "428e4b2230929ef243512a708b1cb03c",
    "buyerId": "a34fc8d0ba8890e72f896b755dcc86e3",
    "quantity": 1,
    "totalPrice": 19.7,
    "deliveryMethod": "buyer_pickup",
    "paymentMethod": "upi",
    "paymentStatus": "completed",
    "orderStatus": "accepted",
    "createdAt": "2026-03-10 17:53:59.212677+00"
  },
  {
    "id": "505b3ff326824bcf2dda50024c4706b8",
    "productId": "3d9c73a9295109b64973d5bd493447cb",
    "farmerId": "7b175d66a9f33cf52328be1eca9c71b4",
    "buyerId": "a34fc8d0ba8890e72f896b755dcc86e3",
    "quantity": 1,
    "totalPrice": 55,
    "deliveryMethod": "buyer_pickup",
    "paymentMethod": "upi",
    "paymentStatus": "completed",
    "orderStatus": "accepted",
    "createdAt": "2026-03-11 03:28:45.044048+00"
  },
  {
    "id": "e55bd237b0cfe2ee5ddbc487c7185020",
    "productId": "f347238e8e299c0efae5d2f7a0eb345b",
    "farmerId": "b63573355c4735d280297187d22fef56",
    "buyerId": "a34fc8d0ba8890e72f896b755dcc86e3",
    "quantity": 2,
    "totalPrice": 40,
    "deliveryMethod": "buyer_pickup",
    "paymentMethod": "upi",
    "paymentStatus": "completed",
    "orderStatus": "pending",
    "createdAt": "2026-03-17 06:14:16.112734+00"
  }
]);
        }

        if (Object.keys([{"id":"c006e51e688d6672094da402d9f19edc","orderId":"5678f05f6e463025349b856d97bb64bf","productId":"4f84e60c5c2743a59be946718fc503b2","buyerId":"1998a136247be1863bb44ce372715577","rating":5,"comment":"Very fresh tomatoes and quick delivery.","createdAt":"2026-03-08 08:20:04.263654+00"},{"id":"34649ad8fcc98337b87ed21e9d9fe4f0","orderId":"ba2f7eed3b3c56d32ff0f2d21918bae7","productId":"4d462a02f95a0ab9c14417431e4ad42b","buyerId":"d8ee1c57ea79eb0fee58c7080cfa73f8","rating":4,"comment":"Good quality bananas and fair pricing. Will order again.","createdAt":"2026-03-08 08:20:04.263654+00"},{"id":"9fd11d616cb9c3c56ee3239506dcecdc","orderId":"ea8674c5ece9449ff8e740de35484a3b","productId":"3184ed51253c1b5b37f389a037b0a092","buyerId":"8dcbd0f88d373e12dbbf0a9c0ccd32f4","rating":5,"comment":"Great tomatoes!","createdAt":"2026-03-10 16:39:44.044877+00"}]).length > 0) {
            console.log('⭐ Inserting reviews...');
            await db.insert(reviews).values([
  {
    "id": "c006e51e688d6672094da402d9f19edc",
    "orderId": "5678f05f6e463025349b856d97bb64bf",
    "productId": "4f84e60c5c2743a59be946718fc503b2",
    "buyerId": "1998a136247be1863bb44ce372715577",
    "rating": 5,
    "comment": "Very fresh tomatoes and quick delivery.",
    "createdAt": "2026-03-08 08:20:04.263654+00"
  },
  {
    "id": "34649ad8fcc98337b87ed21e9d9fe4f0",
    "orderId": "ba2f7eed3b3c56d32ff0f2d21918bae7",
    "productId": "4d462a02f95a0ab9c14417431e4ad42b",
    "buyerId": "d8ee1c57ea79eb0fee58c7080cfa73f8",
    "rating": 4,
    "comment": "Good quality bananas and fair pricing. Will order again.",
    "createdAt": "2026-03-08 08:20:04.263654+00"
  },
  {
    "id": "9fd11d616cb9c3c56ee3239506dcecdc",
    "orderId": "ea8674c5ece9449ff8e740de35484a3b",
    "productId": "3184ed51253c1b5b37f389a037b0a092",
    "buyerId": "8dcbd0f88d373e12dbbf0a9c0ccd32f4",
    "rating": 5,
    "comment": "Great tomatoes!",
    "createdAt": "2026-03-10 16:39:44.044877+00"
  }
]);
        }

        if (Object.keys([{"id":"b8fbee1c5e470fcf114ef7bb3f35425d770644385ebcb816b50eb39b39a094e3","userId":"5db1375d4608a65e36297ebd24377259","expiresAt":"2026-03-16T14:34:11.174Z","createdAt":"2026-03-09 14:34:08.067339+00"},{"id":"3ee056f383e2263972fd2db3df6f59f035c8d5292e98c5a89a5bde06032990c0","userId":"b705ac4a3f11ffbe0b3caee0c8518a10","expiresAt":"2026-03-16T14:34:55.756Z","createdAt":"2026-03-09 14:34:55.758923+00"},{"id":"509384b134ff98a608482e141a08a3ec35e123d448af367f96f89ce27b225a75","userId":"b705ac4a3f11ffbe0b3caee0c8518a10","expiresAt":"2026-03-16T15:30:23.656Z","createdAt":"2026-03-09 15:30:23.661073+00"},{"id":"c87d81914495876e71236ff8963fb86615b409d24875ffca6e7603735814fbcc","userId":"a34fc8d0ba8890e72f896b755dcc86e3","expiresAt":"2026-03-16T15:49:28.747Z","createdAt":"2026-03-09 15:49:28.748005+00"},{"id":"32cba5c7148fc8d3866a2f188c9d5e940f5560a8e58557efe4275901091f62bd","userId":"a34fc8d0ba8890e72f896b755dcc86e3","expiresAt":"2026-03-17T04:48:09.730Z","createdAt":"2026-03-10 04:48:09.732746+00"},{"id":"58923ae61012440244bd600142ad343cd0bdedeb390d0ea1a0e119f21a7c801e","userId":"0a035d5eb21dba5921a6ec3135959f11","expiresAt":"2026-03-17T05:08:46.172Z","createdAt":"2026-03-10 05:08:46.175751+00"},{"id":"38c5e5f9b8f4a3832cad02932c003f58eff28f089002b8af2d67a2bd152ecff0","userId":"a34fc8d0ba8890e72f896b755dcc86e3","expiresAt":"2026-03-17T05:16:48.884Z","createdAt":"2026-03-10 05:16:48.886818+00"},{"id":"6fc302613612aec0d9d1aa47e75c5ec18649fe6a176a1800373faeb6d7206f5f","userId":"a34fc8d0ba8890e72f896b755dcc86e3","expiresAt":"2026-03-17T05:34:06.117Z","createdAt":"2026-03-10 05:34:06.117909+00"},{"id":"3d30fb745fd1ed5635ce68565cdb29973d17f7d36e376095cbb7e77a1b775f79","userId":"a34fc8d0ba8890e72f896b755dcc86e3","expiresAt":"2026-03-17T12:12:40.519Z","createdAt":"2026-03-10 12:12:40.523079+00"},{"id":"10f975af2a8ed0a04df05b5c9cd35bcc54b32d712f5122eefbbb2fa4b8fb4511","userId":"a34fc8d0ba8890e72f896b755dcc86e3","expiresAt":"2026-03-17T13:04:14.017Z","createdAt":"2026-03-10 13:04:14.019247+00"},{"id":"9565435682e77711f60b56fd6f72d0577b8258b62aa1f61470409d409ba48c32","userId":"a34fc8d0ba8890e72f896b755dcc86e3","expiresAt":"2026-03-17T13:04:19.225Z","createdAt":"2026-03-10 13:04:19.229185+00"},{"id":"75d1f514db453a14c48cc5669afcc5cc1be6165bc15f0e1fbf1e2ddfedf7b21f","userId":"a34fc8d0ba8890e72f896b755dcc86e3","expiresAt":"2026-03-17T15:32:32.550Z","createdAt":"2026-03-10 15:32:32.55272+00"},{"id":"414fb99e53553be4b09400a6911e3f4d7eab3dd1a8b8388e20ec7ff3b2178cf3","userId":"f12fe640d94fbc05d4ba78cb30804ec0","expiresAt":"2026-03-17T15:46:09.598Z","createdAt":"2026-03-10 15:46:09.599742+00"},{"id":"e22e95f333d9e7a141b3ad79c6f8bc8930ac66f0ff54ceeb57968a55cbf6db6b","userId":"1f4965fe9a2bfc931ec505463be8f0a5","expiresAt":"2026-03-17T15:46:50.959Z","createdAt":"2026-03-10 15:46:50.960443+00"},{"id":"273068de27fd5874c29aa9dc87b87d18033e99cbba5fcc7ff6a13314f878ece8","userId":"81a09a2e5f847da192e98da3ca12b29e","expiresAt":"2026-03-17T15:49:10.592Z","createdAt":"2026-03-10 15:49:10.5933+00"},{"id":"6a357fefada3419dd3074db1111b0e2ab870ecc01afc21ed712ef74a05e939c6","userId":"f12fe640d94fbc05d4ba78cb30804ec0","expiresAt":"2026-03-17T15:54:05.240Z","createdAt":"2026-03-10 15:54:05.241166+00"},{"id":"c91aaa0ff0c691cfe48d95d16d7413b53ae65779fea43f60f430dacf2c342b15","userId":"a34fc8d0ba8890e72f896b755dcc86e3","expiresAt":"2026-03-17T15:59:36.758Z","createdAt":"2026-03-10 15:59:36.758858+00"},{"id":"ac82d9c8e33e7365d22cf0c540a3b2606ee66b1c2b40f959dad50cb59e3ccc75","userId":"b63573355c4735d280297187d22fef56","expiresAt":"2026-03-17T16:01:40.344Z","createdAt":"2026-03-10 16:01:40.344407+00"},{"id":"e4c96d931fc6babd6f05be098330e1b1acd414190dbc72bbab6f1d72aff35de5","userId":"a34fc8d0ba8890e72f896b755dcc86e3","expiresAt":"2026-03-17T16:07:15.272Z","createdAt":"2026-03-10 16:07:15.273965+00"},{"id":"22760cb33897154fcb15c5eeba005c9da0817101e97195752b4bcdaff8f3463b","userId":"a34fc8d0ba8890e72f896b755dcc86e3","expiresAt":"2026-03-17T16:32:31.113Z","createdAt":"2026-03-10 16:32:31.115407+00"},{"id":"e668a4a8e5b473bed37da08953cee028e518815565ddc2253782af72831ba18b","userId":"b63573355c4735d280297187d22fef56","expiresAt":"2026-03-17T16:35:35.336Z","createdAt":"2026-03-10 16:35:35.337217+00"},{"id":"3c58aac00c22303c5876da5fdd1cd0295e761cb531e9e55d4fae9f7b203ad45d","userId":"1a260b1e20e77ad15f6fea908890356a","expiresAt":"2026-03-17T16:39:43.191Z","createdAt":"2026-03-10 16:39:43.191766+00"},{"id":"17f299f5b38bc8c3e92639739c8c57da3877df899f603697a6d60ad2a2034ed8","userId":"8dcbd0f88d373e12dbbf0a9c0ccd32f4","expiresAt":"2026-03-17T16:39:43.282Z","createdAt":"2026-03-10 16:39:43.283354+00"},{"id":"5dacbcf32a03eebc3e640e49d6a9a9bcd7994cbf2b043bd6ab071d833bbb4c1c","userId":"20792fdc5da556da32aed88b7b1c00dc","expiresAt":"2026-03-17T16:39:43.359Z","createdAt":"2026-03-10 16:39:43.359678+00"},{"id":"ee7b8d767b3d3f11e4fe37893f455e6c01f8e3eb0c9ccaa9129690d0cc828e24","userId":"1a260b1e20e77ad15f6fea908890356a","expiresAt":"2026-03-17T16:39:43.436Z","createdAt":"2026-03-10 16:39:43.437242+00"},{"id":"51a2f8729f0277cf2633af4045bb9e947398e77f79fe3898a417ea381c01438c","userId":"1f9ef2b0d772bf7a938aada09d95d41a","expiresAt":"2026-03-17T17:16:27.407Z","createdAt":"2026-03-10 17:16:27.410117+00"},{"id":"840d4e74bbda357f8ef76a92bfdd819b8acd78054b6a03776bec30fff19a7dc0","userId":"a34fc8d0ba8890e72f896b755dcc86e3","expiresAt":"2026-03-17T17:32:58.648Z","createdAt":"2026-03-10 17:32:58.651349+00"},{"id":"48b2304e1e0938fa294b8200ed55ad35c76a03f417708148aaa0bd317e5eb0ba","userId":"428e4b2230929ef243512a708b1cb03c","expiresAt":"2026-03-17T17:52:25.723Z","createdAt":"2026-03-10 17:52:25.725717+00"},{"id":"59392bf8c7bb84110247a4bd7f80ff80b7f2ffafd64ef30b14f5ad668c2378c4","userId":"6345b08df9a83d089d1dada1293ea253","expiresAt":"2026-03-18T03:22:39.244Z","createdAt":"2026-03-11 03:22:39.246477+00"},{"id":"119b9a219bc2e3704441798e6058d640c9f646c0840b14872fa159632116cf2a","userId":"7b175d66a9f33cf52328be1eca9c71b4","expiresAt":"2026-03-18T03:25:18.682Z","createdAt":"2026-03-11 03:25:18.683836+00"},{"id":"6eacee392cd21eccefd8c2fc514855d892d23af45f13f36f7e9fca0dba6a0394","userId":"7b175d66a9f33cf52328be1eca9c71b4","expiresAt":"2026-03-18T04:35:33.289Z","createdAt":"2026-03-11 04:35:33.292762+00"},{"id":"aedfb0641adf51cbf1efc5c2d9769900cae064395c209fe2f5d669f5dfee6f06","userId":"a34fc8d0ba8890e72f896b755dcc86e3","expiresAt":"2026-03-24T05:24:28.212Z","createdAt":"2026-03-17 05:24:28.217299+00"},{"id":"ff1d6c1d0d2a336c9f7df13cccdfa291c669cc842c1acee985470a21a03e31e2","userId":"2da3a3b4be0322be1fde012f23326f60","expiresAt":"2026-03-24T06:15:58.674Z","createdAt":"2026-03-17 06:15:58.675264+00"}]).length > 0) {
            console.log('🔐 Inserting sessions...');
            await db.insert(sessions).values([
  {
    "id": "b8fbee1c5e470fcf114ef7bb3f35425d770644385ebcb816b50eb39b39a094e3",
    "userId": "5db1375d4608a65e36297ebd24377259",
    "expiresAt": "2026-03-16T14:34:11.174Z",
    "createdAt": "2026-03-09 14:34:08.067339+00"
  },
  {
    "id": "3ee056f383e2263972fd2db3df6f59f035c8d5292e98c5a89a5bde06032990c0",
    "userId": "b705ac4a3f11ffbe0b3caee0c8518a10",
    "expiresAt": "2026-03-16T14:34:55.756Z",
    "createdAt": "2026-03-09 14:34:55.758923+00"
  },
  {
    "id": "509384b134ff98a608482e141a08a3ec35e123d448af367f96f89ce27b225a75",
    "userId": "b705ac4a3f11ffbe0b3caee0c8518a10",
    "expiresAt": "2026-03-16T15:30:23.656Z",
    "createdAt": "2026-03-09 15:30:23.661073+00"
  },
  {
    "id": "c87d81914495876e71236ff8963fb86615b409d24875ffca6e7603735814fbcc",
    "userId": "a34fc8d0ba8890e72f896b755dcc86e3",
    "expiresAt": "2026-03-16T15:49:28.747Z",
    "createdAt": "2026-03-09 15:49:28.748005+00"
  },
  {
    "id": "32cba5c7148fc8d3866a2f188c9d5e940f5560a8e58557efe4275901091f62bd",
    "userId": "a34fc8d0ba8890e72f896b755dcc86e3",
    "expiresAt": "2026-03-17T04:48:09.730Z",
    "createdAt": "2026-03-10 04:48:09.732746+00"
  },
  {
    "id": "58923ae61012440244bd600142ad343cd0bdedeb390d0ea1a0e119f21a7c801e",
    "userId": "0a035d5eb21dba5921a6ec3135959f11",
    "expiresAt": "2026-03-17T05:08:46.172Z",
    "createdAt": "2026-03-10 05:08:46.175751+00"
  },
  {
    "id": "38c5e5f9b8f4a3832cad02932c003f58eff28f089002b8af2d67a2bd152ecff0",
    "userId": "a34fc8d0ba8890e72f896b755dcc86e3",
    "expiresAt": "2026-03-17T05:16:48.884Z",
    "createdAt": "2026-03-10 05:16:48.886818+00"
  },
  {
    "id": "6fc302613612aec0d9d1aa47e75c5ec18649fe6a176a1800373faeb6d7206f5f",
    "userId": "a34fc8d0ba8890e72f896b755dcc86e3",
    "expiresAt": "2026-03-17T05:34:06.117Z",
    "createdAt": "2026-03-10 05:34:06.117909+00"
  },
  {
    "id": "3d30fb745fd1ed5635ce68565cdb29973d17f7d36e376095cbb7e77a1b775f79",
    "userId": "a34fc8d0ba8890e72f896b755dcc86e3",
    "expiresAt": "2026-03-17T12:12:40.519Z",
    "createdAt": "2026-03-10 12:12:40.523079+00"
  },
  {
    "id": "10f975af2a8ed0a04df05b5c9cd35bcc54b32d712f5122eefbbb2fa4b8fb4511",
    "userId": "a34fc8d0ba8890e72f896b755dcc86e3",
    "expiresAt": "2026-03-17T13:04:14.017Z",
    "createdAt": "2026-03-10 13:04:14.019247+00"
  },
  {
    "id": "9565435682e77711f60b56fd6f72d0577b8258b62aa1f61470409d409ba48c32",
    "userId": "a34fc8d0ba8890e72f896b755dcc86e3",
    "expiresAt": "2026-03-17T13:04:19.225Z",
    "createdAt": "2026-03-10 13:04:19.229185+00"
  },
  {
    "id": "75d1f514db453a14c48cc5669afcc5cc1be6165bc15f0e1fbf1e2ddfedf7b21f",
    "userId": "a34fc8d0ba8890e72f896b755dcc86e3",
    "expiresAt": "2026-03-17T15:32:32.550Z",
    "createdAt": "2026-03-10 15:32:32.55272+00"
  },
  {
    "id": "414fb99e53553be4b09400a6911e3f4d7eab3dd1a8b8388e20ec7ff3b2178cf3",
    "userId": "f12fe640d94fbc05d4ba78cb30804ec0",
    "expiresAt": "2026-03-17T15:46:09.598Z",
    "createdAt": "2026-03-10 15:46:09.599742+00"
  },
  {
    "id": "e22e95f333d9e7a141b3ad79c6f8bc8930ac66f0ff54ceeb57968a55cbf6db6b",
    "userId": "1f4965fe9a2bfc931ec505463be8f0a5",
    "expiresAt": "2026-03-17T15:46:50.959Z",
    "createdAt": "2026-03-10 15:46:50.960443+00"
  },
  {
    "id": "273068de27fd5874c29aa9dc87b87d18033e99cbba5fcc7ff6a13314f878ece8",
    "userId": "81a09a2e5f847da192e98da3ca12b29e",
    "expiresAt": "2026-03-17T15:49:10.592Z",
    "createdAt": "2026-03-10 15:49:10.5933+00"
  },
  {
    "id": "6a357fefada3419dd3074db1111b0e2ab870ecc01afc21ed712ef74a05e939c6",
    "userId": "f12fe640d94fbc05d4ba78cb30804ec0",
    "expiresAt": "2026-03-17T15:54:05.240Z",
    "createdAt": "2026-03-10 15:54:05.241166+00"
  },
  {
    "id": "c91aaa0ff0c691cfe48d95d16d7413b53ae65779fea43f60f430dacf2c342b15",
    "userId": "a34fc8d0ba8890e72f896b755dcc86e3",
    "expiresAt": "2026-03-17T15:59:36.758Z",
    "createdAt": "2026-03-10 15:59:36.758858+00"
  },
  {
    "id": "ac82d9c8e33e7365d22cf0c540a3b2606ee66b1c2b40f959dad50cb59e3ccc75",
    "userId": "b63573355c4735d280297187d22fef56",
    "expiresAt": "2026-03-17T16:01:40.344Z",
    "createdAt": "2026-03-10 16:01:40.344407+00"
  },
  {
    "id": "e4c96d931fc6babd6f05be098330e1b1acd414190dbc72bbab6f1d72aff35de5",
    "userId": "a34fc8d0ba8890e72f896b755dcc86e3",
    "expiresAt": "2026-03-17T16:07:15.272Z",
    "createdAt": "2026-03-10 16:07:15.273965+00"
  },
  {
    "id": "22760cb33897154fcb15c5eeba005c9da0817101e97195752b4bcdaff8f3463b",
    "userId": "a34fc8d0ba8890e72f896b755dcc86e3",
    "expiresAt": "2026-03-17T16:32:31.113Z",
    "createdAt": "2026-03-10 16:32:31.115407+00"
  },
  {
    "id": "e668a4a8e5b473bed37da08953cee028e518815565ddc2253782af72831ba18b",
    "userId": "b63573355c4735d280297187d22fef56",
    "expiresAt": "2026-03-17T16:35:35.336Z",
    "createdAt": "2026-03-10 16:35:35.337217+00"
  },
  {
    "id": "3c58aac00c22303c5876da5fdd1cd0295e761cb531e9e55d4fae9f7b203ad45d",
    "userId": "1a260b1e20e77ad15f6fea908890356a",
    "expiresAt": "2026-03-17T16:39:43.191Z",
    "createdAt": "2026-03-10 16:39:43.191766+00"
  },
  {
    "id": "17f299f5b38bc8c3e92639739c8c57da3877df899f603697a6d60ad2a2034ed8",
    "userId": "8dcbd0f88d373e12dbbf0a9c0ccd32f4",
    "expiresAt": "2026-03-17T16:39:43.282Z",
    "createdAt": "2026-03-10 16:39:43.283354+00"
  },
  {
    "id": "5dacbcf32a03eebc3e640e49d6a9a9bcd7994cbf2b043bd6ab071d833bbb4c1c",
    "userId": "20792fdc5da556da32aed88b7b1c00dc",
    "expiresAt": "2026-03-17T16:39:43.359Z",
    "createdAt": "2026-03-10 16:39:43.359678+00"
  },
  {
    "id": "ee7b8d767b3d3f11e4fe37893f455e6c01f8e3eb0c9ccaa9129690d0cc828e24",
    "userId": "1a260b1e20e77ad15f6fea908890356a",
    "expiresAt": "2026-03-17T16:39:43.436Z",
    "createdAt": "2026-03-10 16:39:43.437242+00"
  },
  {
    "id": "51a2f8729f0277cf2633af4045bb9e947398e77f79fe3898a417ea381c01438c",
    "userId": "1f9ef2b0d772bf7a938aada09d95d41a",
    "expiresAt": "2026-03-17T17:16:27.407Z",
    "createdAt": "2026-03-10 17:16:27.410117+00"
  },
  {
    "id": "840d4e74bbda357f8ef76a92bfdd819b8acd78054b6a03776bec30fff19a7dc0",
    "userId": "a34fc8d0ba8890e72f896b755dcc86e3",
    "expiresAt": "2026-03-17T17:32:58.648Z",
    "createdAt": "2026-03-10 17:32:58.651349+00"
  },
  {
    "id": "48b2304e1e0938fa294b8200ed55ad35c76a03f417708148aaa0bd317e5eb0ba",
    "userId": "428e4b2230929ef243512a708b1cb03c",
    "expiresAt": "2026-03-17T17:52:25.723Z",
    "createdAt": "2026-03-10 17:52:25.725717+00"
  },
  {
    "id": "59392bf8c7bb84110247a4bd7f80ff80b7f2ffafd64ef30b14f5ad668c2378c4",
    "userId": "6345b08df9a83d089d1dada1293ea253",
    "expiresAt": "2026-03-18T03:22:39.244Z",
    "createdAt": "2026-03-11 03:22:39.246477+00"
  },
  {
    "id": "119b9a219bc2e3704441798e6058d640c9f646c0840b14872fa159632116cf2a",
    "userId": "7b175d66a9f33cf52328be1eca9c71b4",
    "expiresAt": "2026-03-18T03:25:18.682Z",
    "createdAt": "2026-03-11 03:25:18.683836+00"
  },
  {
    "id": "6eacee392cd21eccefd8c2fc514855d892d23af45f13f36f7e9fca0dba6a0394",
    "userId": "7b175d66a9f33cf52328be1eca9c71b4",
    "expiresAt": "2026-03-18T04:35:33.289Z",
    "createdAt": "2026-03-11 04:35:33.292762+00"
  },
  {
    "id": "aedfb0641adf51cbf1efc5c2d9769900cae064395c209fe2f5d669f5dfee6f06",
    "userId": "a34fc8d0ba8890e72f896b755dcc86e3",
    "expiresAt": "2026-03-24T05:24:28.212Z",
    "createdAt": "2026-03-17 05:24:28.217299+00"
  },
  {
    "id": "ff1d6c1d0d2a336c9f7df13cccdfa291c669cc842c1acee985470a21a03e31e2",
    "userId": "2da3a3b4be0322be1fde012f23326f60",
    "expiresAt": "2026-03-24T06:15:58.674Z",
    "createdAt": "2026-03-17 06:15:58.675264+00"
  }
]);
        }

        if (Object.keys([]).length > 0) {
            console.log('📋 Inserting help reports...');
            await db.insert(helpReports).values([]);
        }

        if (Object.keys([{"id":"e23767947fed1d5866eaeec2ff1d066b","productId":"b9c5dd77feafe0f0655755c5fb8eaf94","buyerId":"b705ac4a3f11ffbe0b3caee0c8518a10","farmerId":"5db1375d4608a65e36297ebd24377259","createdAt":"2026-03-09 14:35:03.379944+00"},{"id":"d8adcb8ee3be722ea4820990d346346c","productId":"f347238e8e299c0efae5d2f7a0eb345b","buyerId":"a34fc8d0ba8890e72f896b755dcc86e3","farmerId":"b63573355c4735d280297187d22fef56","createdAt":"2026-03-10 16:13:02.689727+00"},{"id":"da221385e2e5d816bb5c923406795219","productId":"3184ed51253c1b5b37f389a037b0a092","buyerId":"8dcbd0f88d373e12dbbf0a9c0ccd32f4","farmerId":"1a260b1e20e77ad15f6fea908890356a","createdAt":"2026-03-10 16:39:44.066297+00"},{"id":"4d73e2d0b8a9af7fca33356dc57af94a","productId":"ca29b59d3b367eb724eff55df57d1caf","buyerId":"a34fc8d0ba8890e72f896b755dcc86e3","farmerId":"428e4b2230929ef243512a708b1cb03c","createdAt":"2026-03-10 17:53:30.597719+00"},{"id":"22ac37460c2a0b42dd96f3b171f9e5ed","productId":"3d9c73a9295109b64973d5bd493447cb","buyerId":"a34fc8d0ba8890e72f896b755dcc86e3","farmerId":"7b175d66a9f33cf52328be1eca9c71b4","createdAt":"2026-03-11 03:27:19.320441+00"}]).length > 0) {
            console.log('💬 Inserting chats...');
            await db.insert(chats).values([
  {
    "id": "e23767947fed1d5866eaeec2ff1d066b",
    "productId": "b9c5dd77feafe0f0655755c5fb8eaf94",
    "buyerId": "b705ac4a3f11ffbe0b3caee0c8518a10",
    "farmerId": "5db1375d4608a65e36297ebd24377259",
    "createdAt": "2026-03-09 14:35:03.379944+00"
  },
  {
    "id": "d8adcb8ee3be722ea4820990d346346c",
    "productId": "f347238e8e299c0efae5d2f7a0eb345b",
    "buyerId": "a34fc8d0ba8890e72f896b755dcc86e3",
    "farmerId": "b63573355c4735d280297187d22fef56",
    "createdAt": "2026-03-10 16:13:02.689727+00"
  },
  {
    "id": "da221385e2e5d816bb5c923406795219",
    "productId": "3184ed51253c1b5b37f389a037b0a092",
    "buyerId": "8dcbd0f88d373e12dbbf0a9c0ccd32f4",
    "farmerId": "1a260b1e20e77ad15f6fea908890356a",
    "createdAt": "2026-03-10 16:39:44.066297+00"
  },
  {
    "id": "4d73e2d0b8a9af7fca33356dc57af94a",
    "productId": "ca29b59d3b367eb724eff55df57d1caf",
    "buyerId": "a34fc8d0ba8890e72f896b755dcc86e3",
    "farmerId": "428e4b2230929ef243512a708b1cb03c",
    "createdAt": "2026-03-10 17:53:30.597719+00"
  },
  {
    "id": "22ac37460c2a0b42dd96f3b171f9e5ed",
    "productId": "3d9c73a9295109b64973d5bd493447cb",
    "buyerId": "a34fc8d0ba8890e72f896b755dcc86e3",
    "farmerId": "7b175d66a9f33cf52328be1eca9c71b4",
    "createdAt": "2026-03-11 03:27:19.320441+00"
  }
]);
        }

        if (Object.keys([{"id":"b23dc67cf1069ed080ffff7f716cbbea","chatId":"e23767947fed1d5866eaeec2ff1d066b","senderId":"b705ac4a3f11ffbe0b3caee0c8518a10","text":"Hi, I want to buy tomatoes!","createdAt":"2026-03-09 14:35:12.394317+00"},{"id":"349e36c5567a1b85b888c121dbb61718","chatId":"e23767947fed1d5866eaeec2ff1d066b","senderId":"b705ac4a3f11ffbe0b3caee0c8518a10","text":"Hello from the browser test!","createdAt":"2026-03-09 15:33:10.278614+00"},{"id":"3fd031d0b66f63df92aa771907089a9b","chatId":"d8adcb8ee3be722ea4820990d346346c","senderId":"a34fc8d0ba8890e72f896b755dcc86e3","text":"Hello","createdAt":"2026-03-10 16:13:12.557003+00"},{"id":"6cbdb180ee285fda9c3afd4ec0704f7c","chatId":"d8adcb8ee3be722ea4820990d346346c","senderId":"a34fc8d0ba8890e72f896b755dcc86e3","text":"Hi","createdAt":"2026-03-10 16:13:19.679202+00"},{"id":"47e2883aaa441c893deffa8d5a0a6a36","chatId":"d8adcb8ee3be722ea4820990d346346c","senderId":"a34fc8d0ba8890e72f896b755dcc86e3","text":"I cant see","createdAt":"2026-03-10 16:13:33.507739+00"},{"id":"86bdd6f356c9f634305b83721b063241","chatId":"d8adcb8ee3be722ea4820990d346346c","senderId":"a34fc8d0ba8890e72f896b755dcc86e3","text":"bye","createdAt":"2026-03-10 16:35:55.508546+00"},{"id":"7ae7dced2bf00e48dbc74cc93158e13d","chatId":"da221385e2e5d816bb5c923406795219","senderId":"8dcbd0f88d373e12dbbf0a9c0ccd32f4","text":"Hello farmer!","createdAt":"2026-03-10 16:39:44.078008+00"},{"id":"3ee0932791af570fd45cc50c841d957c","chatId":"d8adcb8ee3be722ea4820990d346346c","senderId":"a34fc8d0ba8890e72f896b755dcc86e3","text":"se","createdAt":"2026-03-10 16:42:08.626641+00"},{"id":"7e151cff4133beb342cbd7942a138d86","chatId":"4d73e2d0b8a9af7fca33356dc57af94a","senderId":"a34fc8d0ba8890e72f896b755dcc86e3","text":"hello","createdAt":"2026-03-10 17:53:32.604499+00"},{"id":"0c93be186fd5b996c8fce55f9221105d","chatId":"22ac37460c2a0b42dd96f3b171f9e5ed","senderId":"a34fc8d0ba8890e72f896b755dcc86e3","text":"HI","createdAt":"2026-03-11 03:27:28.567435+00"},{"id":"2f30165a6125a9fd725caf278663852e","chatId":"22ac37460c2a0b42dd96f3b171f9e5ed","senderId":"a34fc8d0ba8890e72f896b755dcc86e3","text":"bye","createdAt":"2026-03-11 03:27:47.910817+00"},{"id":"a9a5888c769b905b72f60caba371a98d","chatId":"4d73e2d0b8a9af7fca33356dc57af94a","senderId":"a34fc8d0ba8890e72f896b755dcc86e3","text":"Hello","createdAt":"2026-03-11 04:59:42.277465+00"}]).length > 0) {
            console.log('✉️ Inserting messages...');
            await db.insert(messages).values([
  {
    "id": "b23dc67cf1069ed080ffff7f716cbbea",
    "chatId": "e23767947fed1d5866eaeec2ff1d066b",
    "senderId": "b705ac4a3f11ffbe0b3caee0c8518a10",
    "text": "Hi, I want to buy tomatoes!",
    "createdAt": "2026-03-09 14:35:12.394317+00"
  },
  {
    "id": "349e36c5567a1b85b888c121dbb61718",
    "chatId": "e23767947fed1d5866eaeec2ff1d066b",
    "senderId": "b705ac4a3f11ffbe0b3caee0c8518a10",
    "text": "Hello from the browser test!",
    "createdAt": "2026-03-09 15:33:10.278614+00"
  },
  {
    "id": "3fd031d0b66f63df92aa771907089a9b",
    "chatId": "d8adcb8ee3be722ea4820990d346346c",
    "senderId": "a34fc8d0ba8890e72f896b755dcc86e3",
    "text": "Hello",
    "createdAt": "2026-03-10 16:13:12.557003+00"
  },
  {
    "id": "6cbdb180ee285fda9c3afd4ec0704f7c",
    "chatId": "d8adcb8ee3be722ea4820990d346346c",
    "senderId": "a34fc8d0ba8890e72f896b755dcc86e3",
    "text": "Hi",
    "createdAt": "2026-03-10 16:13:19.679202+00"
  },
  {
    "id": "47e2883aaa441c893deffa8d5a0a6a36",
    "chatId": "d8adcb8ee3be722ea4820990d346346c",
    "senderId": "a34fc8d0ba8890e72f896b755dcc86e3",
    "text": "I cant see",
    "createdAt": "2026-03-10 16:13:33.507739+00"
  },
  {
    "id": "86bdd6f356c9f634305b83721b063241",
    "chatId": "d8adcb8ee3be722ea4820990d346346c",
    "senderId": "a34fc8d0ba8890e72f896b755dcc86e3",
    "text": "bye",
    "createdAt": "2026-03-10 16:35:55.508546+00"
  },
  {
    "id": "7ae7dced2bf00e48dbc74cc93158e13d",
    "chatId": "da221385e2e5d816bb5c923406795219",
    "senderId": "8dcbd0f88d373e12dbbf0a9c0ccd32f4",
    "text": "Hello farmer!",
    "createdAt": "2026-03-10 16:39:44.078008+00"
  },
  {
    "id": "3ee0932791af570fd45cc50c841d957c",
    "chatId": "d8adcb8ee3be722ea4820990d346346c",
    "senderId": "a34fc8d0ba8890e72f896b755dcc86e3",
    "text": "se",
    "createdAt": "2026-03-10 16:42:08.626641+00"
  },
  {
    "id": "7e151cff4133beb342cbd7942a138d86",
    "chatId": "4d73e2d0b8a9af7fca33356dc57af94a",
    "senderId": "a34fc8d0ba8890e72f896b755dcc86e3",
    "text": "hello",
    "createdAt": "2026-03-10 17:53:32.604499+00"
  },
  {
    "id": "0c93be186fd5b996c8fce55f9221105d",
    "chatId": "22ac37460c2a0b42dd96f3b171f9e5ed",
    "senderId": "a34fc8d0ba8890e72f896b755dcc86e3",
    "text": "HI",
    "createdAt": "2026-03-11 03:27:28.567435+00"
  },
  {
    "id": "2f30165a6125a9fd725caf278663852e",
    "chatId": "22ac37460c2a0b42dd96f3b171f9e5ed",
    "senderId": "a34fc8d0ba8890e72f896b755dcc86e3",
    "text": "bye",
    "createdAt": "2026-03-11 03:27:47.910817+00"
  },
  {
    "id": "a9a5888c769b905b72f60caba371a98d",
    "chatId": "4d73e2d0b8a9af7fca33356dc57af94a",
    "senderId": "a34fc8d0ba8890e72f896b755dcc86e3",
    "text": "Hello",
    "createdAt": "2026-03-11 04:59:42.277465+00"
  }
]);
        }

        console.log('\n✅ Database seeded successfully!');
    } catch (error) {
        console.error('❌ Error seeding database:', error);
    } finally {
        process.exit(0);
    }
}

seedFromExport();
