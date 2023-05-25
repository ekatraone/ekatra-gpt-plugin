require('dotenv').config();

const express = require('express');
const axios = require('axios');
const schedule = require('node-schedule');
const {Twilio} = require('twilio');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

// WATI client
const watiClient = axios.create({
  baseURL: process.env.WATI_API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    apikey: process.env.WATI_API_KEY,
  },
});

// Axios instance for OpenAI API
const api = axios.create({
  baseURL: 'https://api.openai.com/v1',
  headers: {
    Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
    'Content-Type': 'application/json',
  },
});

app.use(express.json());

// Schedule a job to send the course every day
const sendCourseJob = schedule.scheduleJob('0 9 * * *', async () => {
  try {
    const topicResponse = await processPromptWithChatGPT('You are a student.', 'Please enter the topic for the course you want to generate:');
    const courseTopic = extractCourseTopic(topicResponse);

    if (courseTopic) {
      const courseStructure = await generateCourseStructureWithChatGPT(courseTopic);

      const deliveryResponse = await processPromptWithChatGPT('You are a student.', 'Do you want the course delivered on WhatsApp? (Yes/No)');
      const wantsDelivery = checkDeliveryPreference(deliveryResponse);

      if (wantsDelivery) {
        await sendCourseToWhatsApp('+1234567890', courseStructure);
      }
    }
  } catch (error) {
    console.error('Error scheduling job:', error);
  }
});

// Handle incoming WhatsApp messages
app.post('/webhook', async (req, res) => {
  const {contact, messages} = req.body;
  const from = contact.phone.number;
  const body = messages[0].text.body;

  try {
    const pluginResponse = await processMessageWithChatGPT(body);
    await sendResponseToWhatsApp(from, pluginResponse);
    res.sendStatus(200);
  } catch (error) {
    console.error('Error processing incoming message:', error);
    res.sendStatus(500);
  }
});

async function sendResponseToWhatsApp(number, response) {
  try {
    const formattedNumber = `whatsapp:${number}`;
    const sendMessageResponse = await watiClient.post('/sendMessage', {
      phone: formattedNumber,
      body: response,
    });
  } catch (error) {
    console.error('Error sending message:', error);
  }
}

async function processPromptWithChatGPT(role, prompt) {
  const response = await api.post('/chat/completions', {
    messages: [{ role: 'system', content: role }, { role: 'user', content: prompt }],
  });

  return response.data;
}

function extractCourseTopic(pluginResponse) {
  // TODO: Implement this
  return 'Topic X'; // Placeholder
}

async function generateCourseStructureWithChatGPT(courseTopic) {
  const prompt = `Please generate the course structure for the ${courseTopic} course.`;
  const response = await api.post('/chat/completions', {
    messages: [{ role: 'system', content: 'You are a course generator.' }, { role: 'user', content: prompt }],
  });

  return response.data.choices.map(choice => choice.message.content).join('\n');
}

function checkDeliveryPreference(pluginResponse) {
  // TODO: Implement this
  return true; // Placeholder
}

async function sendCourseToWhatsApp(to, courseStructure) {
  // TODO: Implement this using Twilio or another library
  console.log(`Sending course to ${to}: ${courseStructure}`);
}

async function sendResponseToWhatsApp(to, message) {
  // TODO: Implement this using Twilio or another library
  console.log(`Sending message to ${to}: ${message}`);
}

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
