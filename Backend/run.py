from app import create_app
from apscheduler.schedulers.background import BackgroundScheduler
from jobs.train_lstm_job import train_lstm
scheduler = BackgroundScheduler()
scheduler.add_job(train_lstm, trigger='interval', days=3) 
scheduler.start()
app = create_app()

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000,debug=True)
