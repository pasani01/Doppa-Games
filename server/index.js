const express = require('express');
const cors = require('cors');
const swaggerUi = require('swagger-ui-express');
const swaggerJsdoc = require('swagger-jsdoc');
const { img } = require('framer-motion/client');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Swagger configuration
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Doppa Games API',
      version: '1.0.0',
      description: 'API for Doppa Games platforms',
    },
    servers: [
      {
        url: `http://localhost:${PORT}`,
      },
    ],
  },
  apis: ['./index.js'], // files containing annotations as above
};

const swaggerDocs = swaggerJsdoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));

/**
 * @openapi
 * /api/games:
 *   get:
 *     description: Get all games
 *     responses:
 *       200:
 *         description: Returns a list of games
 */
app.get('/api/games', (req, res) => {
  const games = [
    {
      name: 'Space Doppa',
      desc: 'Kosmosda maceralar — yulduzlar orasida omon qol!',
      tags: ['Action', 'Survival'],
      img: ''
    },
    {
      name: 'Doppa Quest',
      desc: 'Epik RPG dunyo — qahramonlik yo\'li seni kutmoqda!',
      tags: ['RPG', 'Story'],
      img: ''
    },
    {
      name: 'Eco Doppa',
      desc: 'Tabiatni asrash yo\'lidagi qiziqarli strategiya.',
      tags: ['Strategy', 'Eco'],
      img: ''
    },
    {
      name: 'Turbo Doppa',
      desc: 'Tezlik, hayajon va raqobat — poygada g\'olib bo\'l!',
      tags: ['Racing', 'PvP'],
      img: ''
    },
    {
      name: 'Brain Doppa',
      desc: 'Aqlni sinaydigan jumboqlar va strategik o\'yinlar!',
      tags: ['Puzzle', 'Logic'],
      img: ''
    },
    {
      name: 'Doppa Warriors',
      desc: 'So\'nggi jangchi — maydonni zabt et, tarixda qol!',
      tags: ['Battle', 'Co-op'],
      img: ''
    }
  ];
  res.json(games);
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
  console.log(`Swagger documentation: http://localhost:${PORT}/api-docs`);
});
