import fs from 'fs';
try {
  console.log("Root:", fs.readdirSync('/'));
} catch (e) {}
try {
  console.log("Mnt:", fs.readdirSync('/mnt/data'));
} catch (e) {}
try {
  console.log("Mnt:", fs.readdirSync('/mnt'));
} catch (e) {}
