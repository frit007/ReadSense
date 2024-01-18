# ReadSense
This a proof of concept project experimenting with showing helpful text related to words the users are struggling with. See it in [action](https://youtu.be/9g5AHD-ann0).


# Setup
Install the Python version that is supported by [Tobii](https://connect.tobii.com/s/sdk-downloads?language=en_US). At the time of writing, you should use 3.8. 

Install the [Tobii software](https://gaming.tobii.com/getstarted/). 
```
python -m pip install -U pip setuptools

python -m pip install tobii_research
```

Then install libraries for hosting the webserver and testing.
```
python -m pip install flask-socketio

python -m pip install gevent 

python -m pip install gevent-websocket

python -m pip install pyautogui
```

## License file
Include your license file in the root folder and in the main file

# Testing
If you don't have access to a Tobii eye tracker but still want to experiment with the website you can disable the eye tracker and instead send mouse positions to the client. (You can also comment out the tobii_research import).

```
# senderThread = gevent.Greenlet(eye_sender)
senderThread = gevent.Greenlet(mouse_sender)
```

## Coding style note
This was created as a throwaway prototype, therefore the coding style is optimized for getting something working quickly and not scalability.

