#!/usr/bin/python

import asyncio
import board
import datetime
import neopixel
import threading
import time

HOST='localhost'
PORT=4024
PIXEL_PIN=board.D18
PIXELS=4

# Neo pixel
neopix = neopixel.NeoPixel(PIXEL_PIN, PIXELS)
neopix.fill((0, 0, 0))

satellites = 0

def blink_satellites():
    while True:
        for i in range(satellites):
            neopix[1] = (0, 0, 64)
            time.sleep(.4)
            neopix[1] = (0, 0, 0)
            time.sleep(.4)

        time.sleep(1.6)

def parse_rtk_status(buff):
    line = buff.decode('latin1')

    if not line:
        return None

    parts = line.split()

    # 2021/04/10 13:35:12.000   51.742048436   -0.964066753   126.0773   2   7   0.2126   0.2372   0.2537  -0.1856   0.1393   0.1355   0.99    1.0
    return {
            'date': datetime.datetime.strptime(f"{parts[0]} {parts[1]}", "%Y/%m/%d %H:%M:%S.%f"),
            'lat': float(parts[2]),
            'lng': float(parts[3]),
            'height': float(parts[4]),
            'quality': int(parts[5]),
            'satellites': int(parts[6])
    }

async def rtkrcv_client():
    global satellites

    reader, _ = await asyncio.open_connection(HOST, PORT)

    while True:
        buff = await reader.readline()
        if not buff:
            break

        rtk_status = parse_rtk_status(buff)

        if not rtk_status:
            continue;

        if rtk_status.get('quality') == 1:
            neopix[0] = (0, 64, 0)
        else:
            neopix[0] = (64, 40, 0)

        satellites = rtk_status.get('satellites')
        print(rtk_status)

blink_satellites_thread = threading.Thread(target=blink_satellites)
blink_satellites_thread.start()

asyncio.run(rtkrcv_client())
