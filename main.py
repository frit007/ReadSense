from flask import Flask, render_template, send_from_directory
from flask_socketio import SocketIO
from threading import Thread
from flask_socketio import send, emit
import gevent
import pyautogui as pyui
import tobii_research as tr
import time

app = Flask(__name__)
app.config['SECRET_KEY'] = 'secret!'
socketio = SocketIO(app,cors_allowed_origins="*", async_mode="gevent")

def ping_in_intervals():
    while True:
        sio.sleep(10)
        sio.emit('ping')     

@socketio.on('message')
def handle_message(data):
    print('received message: ' + data)

@socketio.on('connection_established')
def handle_message(data):
    print('est received message: ', data)
    socketio.emit('message', "hi socket io")

@app.route('/<path:path>')
def send_report(path):
    return send_from_directory('public', path)
killerThread=None

global_gaze_data = None
def gaze_data_callback(gaze_data):
    global global_gaze_data
    global_gaze_data = gaze_data
    print(gaze_data)

    # Print gaze points of left and right eye
    print("Left eye: ({gaze_left_eye}) \t Right eye: ({gaze_right_eye})".format(
        gaze_left_eye=gaze_data['left_gaze_point_on_display_area'],
        gaze_right_eye=gaze_data['right_gaze_point_on_display_area']))

def eye_sender():
    global global_gaze_data

    found_eyetrackers = tr.find_all_eyetrackers()
    if len(ft) == 0:
        print("No Eye Trackers found!?")
        exit(1)
    my_eyetracker = found_eyetrackers[0]
    print("Address: " + my_eyetracker.address)
    print("Model: " + my_eyetracker.model)
    print("Name (It's OK if this is empty): " + my_eyetracker.device_name)
    print("Serial number: " + my_eyetracker.serial_number)
    my_eyetracker.subscribe_to(tr.EYETRACKER_GAZE_DATA, gaze_data_callback, as_dictionary=True)
    while True:
        if global_gaze_data != None:

            m = "now?"
            print('sending', m)
            socketio.emit('update_focus', {
                "x": (global_gaze_data['left_gaze_point_on_display_area'][0] + global_gaze_data['right_gaze_point_on_display_area'][0])/2, 
                "y": (global_gaze_data['left_gaze_point_on_display_area'][1] + global_gaze_data['right_gaze_point_on_display_area'][1])/2
            })
            gevent.sleep(0.1)
            print('sleep?', m)



def mouse_sender():
    while True:
        m = "now?"
        
        socketio.emit('update_focus', {"x": pyui.position().x, "y": pyui.position().y})
        gevent.sleep(0.01)
        

# def killer():
#     global senderThread
#     while True:
#         input()
#         print("kill!")
#         gevent.kill(senderThread)
#         quit()

# killerThread = gevent.Greenlet(killer)

if __name__ == '__main__':
    senderThread = gevent.Greenlet(eye_sender)
    # senderThread = gevent.Greenlet(mouse_sender)
    senderThread.start()
    # killerThread.start()

    socketio.run(app)