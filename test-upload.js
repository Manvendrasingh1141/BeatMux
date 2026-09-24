const axios = require('axios');
async function test() {
  const api = axios.create({ baseURL: 'http://127.0.0.1:3000/api' });
  const loginRes = await api.post('/auth/login', {email:'abc@gmail.com',password:'abc123'});
  const cookie = loginRes.headers['set-cookie'][0];
  const authHeader = 'Bearer ' + loginRes.data.data.accessToken;
  
  const roomRes = await api.post('/rooms', {name: 'Test Room'}, {headers:{Authorization: authHeader}});
  const roomCode = roomRes.data.data.room.roomCode;
  
  const sigRes = await api.post(`/rooms/${roomCode}/assets/upload-url`, {originalName:'test.mp3',mimeType:'audio/mpeg',size:100}, {headers:{Authorization: authHeader, Cookie: cookie}});
  console.log('SIG:', sigRes.data);
}
test().catch(console.error);
