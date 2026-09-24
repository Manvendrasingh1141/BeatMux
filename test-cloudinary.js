const axios = require('axios');
const fs = require('fs');
const FormData = require('form-data');

async function test() {
  const api = axios.create({ baseURL: 'http://127.0.0.1:3000/api' });
  const loginRes = await api.post('/auth/login', {email:'abc@gmail.com',password:'abc123'});
  const authHeader = 'Bearer ' + loginRes.data.data.accessToken;
  
  const roomRes = await api.post('/rooms', {name: 'Test Room'}, {headers:{Authorization: authHeader}});
  const roomCode = roomRes.data.data.room.roomCode;
  
  // create dummy file
  fs.writeFileSync('dummy.mp3', 'dummy audio content');
  
  const sigRes = await api.post(`/rooms/${roomCode}/assets/upload-url`, {originalName:'dummy.mp3',mimeType:'audio/mpeg',size:19}, {headers:{Authorization: authHeader}});
  const { asset, signatureData } = sigRes.data.data;
  
  console.log('Signature:', signatureData);
  
  const form = new FormData();
  form.append('file', fs.createReadStream('dummy.mp3'));
  form.append('api_key', signatureData.apiKey);
  form.append('timestamp', signatureData.timestamp);
  form.append('signature', signatureData.signature);
  form.append('folder', `syncwave/${roomRes.data.data.room._id}`);
  form.append('public_id', asset._id);
  
  const cloudinaryUrl = `https://api.cloudinary.com/v1_1/${signatureData.cloudName}/video/upload`;
  console.log('Uploading to:', cloudinaryUrl);
  
  try {
    const uploadRes = await axios.post(cloudinaryUrl, form, { headers: form.getHeaders() });
    console.log('Upload success:', uploadRes.data.secure_url);
  } catch(e) {
    console.error('Upload failed:', e.response?.status, e.response?.data);
  }
}
test().catch(console.error);
