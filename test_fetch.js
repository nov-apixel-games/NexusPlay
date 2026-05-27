fetch("http://localhost:3000/api/cloudinary-signature?folder=test").then(r => r.text()).then(console.log).catch(console.error);
