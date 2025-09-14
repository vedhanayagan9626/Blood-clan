# Blood-Clan 🩸

An AI-powered web application that revolutionizes blood donation by connecting donors with people in urgent need through cutting-edge fingerprint-based blood group detection.

## 🌟 Features

### 🧠 AI Blood Group Detection

- Upload fingerprint images to predict blood groups using ResNet-based machine learning
- Supports all 8 major blood types (A+, A-, B+, B-, AB+, AB-, O+, O-)
- 65%+ confidence threshold for medical safety
- 256x256 RGB image processing

### 📍 Location-Based Matching

- Find blood requests and donors in your area
- Smart geographic filtering
- Real-time location-based recommendations
- Emergency response optimization

### ⚡ Real-Time Request Management

- Create and manage blood donation requests instantly
- Patient details and urgency classification
- Direct communication between donors and requesters
- Request status tracking

### 📱 Mobile-Responsive Design

- Works seamlessly on all devices
- Bootstrap 5 responsive framework
- Touch-friendly interface
- Progressive Web App ready

### 🔒 Secure Verification

- Multi-step donor verification process
- AI-verified blood group registration
- Secure file upload handling
- Privacy-focused data management

## 🛠️ Technology Stack

### Backend

- **Framework**: Flask (Python 3.9+)
- **Database**: Microsoft SQL Server with SQLAlchemy ORM
- **AI/ML**: TensorFlow/Keras with ResNet architecture
- **API**: RESTful API design
- **Migrations**: Flask-Migrate

### Frontend

- **UI Framework**: Bootstrap 5
- **JavaScript**: jQuery
- **Styling**: Custom CSS3
- **Responsive**: Mobile-first design

### DevOps

- **Containerization**: Docker & Docker Compose
- **Environment**: Environment variable configuration
- **Development**: Hot-reload development server

## 🚀 Quick Start

### Prerequisites

- Python 3.9 or higher
- Microsoft SQL Server
- ODBC Driver 17 for SQL Server
- Docker (optional)

### Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/vedhanayagan9626/Blood-clan.git
   cd Blood-clan
   ```

2. **Set up virtual environment**

   ```bash
   python -m venv venv
   source venv/bin/activate  # Windows: venv\Scripts\activate
   ```

3. **Install dependencies**

   ```bash
   pip install -r requirements.txt
   ```

4. **Environment configuration**

   ```bash
   cp .env.example .env
   # Edit .env with your database and model configuration
   ```

5. **Database setup**

   ```bash
   flask db init
   flask db migrate -m "Initial migration"
   flask db upgrade
   ```

6. **Add AI model**

   - Place your trained ResNet model in the `models/` directory
   - Update `MODEL_PATH` in `.env` to point to your model file

7. **Run the application**
   ```bash
   python run.py
   ```

### Docker Setup

1. **Build and run with Docker Compose**

   ```bash
   docker-compose up --build
   ```

2. **Initialize database (first time)**
   ```bash
   docker-compose exec web flask db init
   docker-compose exec web flask db migrate -m "Initial migration"
   docker-compose exec web flask db upgrade
   ```

## 📁 Project Structure

```
Blood-clan/
├── app/
│   ├── __init__.py              # Application factory
│   ├── models.py               # Database models
│   ├── routes/
│   │   ├── main.py            # Main routes
│   │   ├── model_api.py       # AI model endpoints
│   │   └── requests_api.py    # Request management API
│   ├── services/
│   │   ├── model_service.py   # AI model service
│   │   └── geo_service.py     # Location services
│   ├── static/
│   │   ├── css/styles.css     # Custom styles
│   │   └── js/
│   │       ├── main.js        # Core JavaScript
│   │       └── fingerprint.js # Fingerprint handling
│   └── templates/
│       ├── layout.html        # Base template
│       ├── home.html         # Landing page
│       ├── create_request.html # Request creation
│       ├── request_list.html  # Request listing
│       └── request_detail.html # Request details
├── models/
│   └── model_blood_group_detection_resnet.h5
├── migrations/                 # Database migrations
├── uploads/                   # Uploaded files
├── config.py                  # Configuration
├── run.py                     # Application entry point
├── requirements.txt           # Dependencies
├── Dockerfile
├── docker-compose.yml
└── README.md
```

## 🔌 API Endpoints

### Model API

- `POST /api/model/predict` - Predict blood group from fingerprint
- `GET /api/model/health` - Model service health check

### Requests API

- `GET /api/requests` - List blood requests (with filters)
- `POST /api/requests` - Create new blood request
- `GET /api/requests/<id>` - Get specific request
- `POST /api/requests/<id>/optin` - Register as donor

## ⚙️ Configuration

### Environment Variables

```bash
SECRET_KEY=your-secret-key
DATABASE_URI=mssql+pyodbc://username:password@server/database?driver=ODBC+Driver+17+for+SQL+Server
MODEL_PATH=models/model_blood_group_detection_resnet.h5
PREDICT_THRESHOLD=0.65
FLASK_ENV=development
FLASK_DEBUG=1
```

## 🧪 AI Model Requirements

The application expects a TensorFlow/Keras model with:

- **Input**: 256x256x3 RGB images
- **Output**: 8 blood group classes (A+, A-, B+, B-, AB+, AB-, O+, O-)
- **Format**: H5 saved model
- **Architecture**: ResNet-based CNN

### Blood Group Classes

- 0: A+ (A Positive)
- 1: A- (A Negative)
- 2: AB+ (AB Positive)
- 3: AB- (AB Negative)
- 4: B+ (B Positive)
- 5: B- (B Negative)
- 6: O+ (O Positive)
- 7: O- (O Negative)

## 📱 Usage Guide

### For Blood Requesters

1. Navigate to "Create Request"
2. Fill in patient details and location
3. Specify required blood group and urgency
4. Submit request for immediate publication

### For Donors

1. Browse available requests in "View Requests"
2. Use filters for blood group and location compatibility
3. Upload fingerprint image for AI blood group verification
4. If confidence threshold is met, register as donor
5. Contact requester through provided details

### AI Blood Group Detection

1. Take a clear, well-lit fingerprint photograph
2. Upload through the fingerprint detection interface
3. AI model processes and predicts blood group
4. Confidence score displayed with prediction
5. Only high-confidence predictions accepted for donations

## 🌍 Social Impact

### Target Applications

- **NGOs**: Rapid donor mobilization during emergencies
- **Community Groups**: Organized blood donation drives
- **Healthcare**: Support for traditional blood banking
- **Emergency Services**: Quick response to critical situations

### Benefits

- Increased accessibility to blood group testing
- Faster donor-requester connections
- Geographic optimization for emergency response
- Streamlined donation process

## 🔒 Security & Privacy

- Secure file upload validation
- SQL injection prevention through ORM
- Environment-based sensitive configuration
- Input sanitization and validation
- HTTPS recommended for production

## ⚠️ Medical Disclaimer

**IMPORTANT**: This application is designed for educational and research purposes only. AI blood group predictions should never replace professional medical testing. Always verify blood compatibility through certified medical procedures before any donation or transfusion.

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines

- Follow PEP 8 for Python code
- Add tests for new features
- Update documentation as needed
- Ensure Docker compatibility

## 🐛 Issues & Support

- Report bugs through GitHub Issues
- For feature requests, create a detailed issue
- Check existing issues before creating new ones
- Provide clear reproduction steps for bugs

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built with educational purposes in mind
- Inspired by the need for accessible healthcare technology
- Thanks to the open-source community for amazing tools and libraries

## 📞 Emergency Contacts (India)

- **Ambulance**: 108
- **Medical Emergency**: 102
- **Blood Bank Information**: Contact your nearest hospital

---

**Built with ❤️ for social impact and community service**

_Remember: Technology should serve humanity, especially in times of need._
