# BloodClan - AI-Powered Blood Donation Network

BloodClan is a web application that connects blood donors with people in urgent need using AI-powered fingerprint analysis to determine blood groups.

## Features

- **AI Blood Group Detection**: Upload fingerprint images to predict blood groups using machine learning
- **Location-Based Matching**: Find blood requests and donors near your location
- **Real-Time Requests**: Create and manage blood donation requests
- **Donor Registration**: Register as a donor with AI-verified blood group
- **Mobile-Friendly**: Responsive design works on all devices

## Technology Stack

- **Backend**: Flask, SQLAlchemy, TensorFlow/Keras
- **Database**: Microsoft SQL Server
- **Frontend**: Bootstrap 5, jQuery, HTML5
- **AI Model**: ResNet-based blood group classification
- **Deployment**: Docker, Docker Compose

## Installation

### Prerequisites

- Python 3.9+
- Microsoft SQL Server
- ODBC Driver 17 for SQL Server

### Local Development

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd bloodclan
   ```

2. **Create virtual environment**
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

4. **Setup environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

5. **Setup database**
   ```bash
   flask db init
   flask db migrate -m "Initial migration"
   flask db upgrade
   ```

6. **Add your AI model**
   - Place your trained model file in the `models/` directory
   - Update `MODEL_PATH` in `.env` to point to your model

7. **Run the application**
   ```bash
   python run.py
   ```

### Docker Deployment

1. **Build and run with Docker Compose**
   ```bash
   docker-compose up --build
   ```

2. **Initialize database** (first time only)
   ```bash
   docker-compose exec web flask db init
   docker-compose exec web flask db migrate -m "Initial migration"
   docker-compose exec web flask db upgrade
   ```

## API Endpoints

### Model API
- `POST /api/model/predict` - Predict blood group from fingerprint
- `GET /api/model/health` - Health check for model service

### Requests API
- `GET /api/requests` - List blood requests (with filters)
- `POST /api/requests` - Create new blood request
- `GET /api/requests/<id>` - Get specific request
- `POST /api/requests/<id>/optin` - Register as donor for request

## Configuration

### Environment Variables

- `SECRET_KEY` - Flask secret key
- `DATABASE_URI` - SQL Server connection string
- `MODEL_PATH` - Path to the trained model file
- `PREDICT_THRESHOLD` - Minimum confidence threshold (default: 0.65)
- `FLASK_ENV` - Environment (development/production)
- `FLASK_DEBUG` - Debug mode (1/0)

### Model Requirements

The application expects a TensorFlow/Keras model that:
- Takes 256x256x3 RGB images as input
- Outputs predictions for 8 blood group classes:
  - 0: A+, 1: A-, 2: AB+, 3: AB-, 4: B+, 5: B-, 6: O+, 7: O-
- Is saved in H5 format

## Usage

1. **Creating a Blood Request**
   - Navigate to "Create Request"
   - Fill in patient details and location
   - Specify blood group and urgency

2. **Finding Requests**
   - Go to "View Requests" 
   - Use filters for blood group and location
   - Contact requesters directly

3. **Donating Blood**
   - Find a compatible request
   - Upload fingerprint for blood group verification
   - Register as donor if AI confidence is sufficient

4. **AI Blood Group Detection**
   - Take/upload a clear fingerprint image
   - System predicts blood group with confidence score
   - Only predictions above threshold are accepted for donation

## File Structure

```
bloodclan/
├── app/
│   ├── __init__.py
│   ├── models.py
│   ├── routes/
│   │   ├── main.py
│   │   ├── model_api.py
│   │   └── requests_api.py
│   ├── services/
│   │   ├── model_service.py
│   │   └── geo_service.py
│   ├── static/
│   │   ├── css/styles.css
│   │   └── js/
│   │       ├── main.js
│   │       └── fingerprint.js
│   └── templates/
│       ├── layout.html
│       ├── home.html
│       ├── create_request.html
│       ├── request_list.html
│       └── request_detail.html
├── models/
│   └── model_blood_group_detection_resnet.h5
├── migrations/
├── uploads/
├── config.py
├── run.py
├── requirements.txt
├── Dockerfile
├── docker-compose.yml
└── README.md
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

This project is licensed under the MIT License.

## Disclaimer

This application is for educational and research purposes. AI blood group predictions should not replace professional medical testing. Always verify blood compatibility through certified medical procedures before donation or transfusion.

## Support

For support and questions:
- Create an issue in the repository
- Contact the development team

---

**Emergency Numbers (India):**
- Ambulance: 108
- Medical Emergency: 102