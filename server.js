require('dotenv').config();

const express = require('express');
const axios = require('axios');
const app = express();
const port = process.env.PORT || 3000;

// Axios instance for OpenAI API
const openaiApi = axios.create({
  baseURL: 'https://api.openai.com/v1',
  headers: {
    Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
    'Content-Type': 'application/json',
  },
});

// Axios instance for Airtable API
const airtableApi = axios.create({
  baseURL: 'https://api.airtable.com/v0',
  headers: {
    Authorization: `Bearer ${process.env.AIRTABLE_API_KEY}`,
    'Content-Type': 'application/json',
  },
});

app.use(express.json());

app.post('/generateAndStoreCourse', async (req, res) =&gt; {
  const topic = req.body.topic;
  const courseStructure = await generateCourseStructureWithChatGPT(topic);

  // You should replace 'YourBaseID' and 'YourTableName' with your specific values
  const airtableResponse = await airtableApi.post('/YourBaseID/YourTableName', {
    fields: {
      topic: topic,
      course_structure: courseStructure,
    },
  });

  res.status(airtableResponse.status).json(airtableResponse.data);
});

async function generateCourseStructureWithChatGPT(courseTopic) {
  const prompt = `Please generate the course structure for the ${courseTopic} course.`;
  const response = await openaiApi.post('/chat/completions', {
    model: 'gpt-3.5-turbo',
    messages: [{ role: 'system', content: 'You are a course generator.' }, { role: 'user', content: prompt }],
  });

  // Extract and return the course structure from the response
  const courseStructure = response.data.choices[0].text.trim();
  return courseStructure;
}

app.listen(port, () =&gt; {
  console.log(`Server is running at http://localhost:${port}`);
});
