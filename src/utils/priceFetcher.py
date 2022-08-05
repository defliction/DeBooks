import asyncio
import json
import numpy as np
import pandas as pd
import multiprocessing
import os
import time
import datetime
import requests



file_path = "log_file.txt"
pairs = ["warpped-solana", "USDC", "mSOL"]


def main(): 
    while True: 
        try:
            print("starting")
            df = pd.read_json(f'wrapped-solana.json', convert_dates=False)
            df.date = pd.to_datetime(df.date, format='%d-%m-%Y')
            print(df)
            latest_date = df.date.max()
            next_date = latest_date + datetime.timedelta(days=1)
            today = datetime.date.today()
            print(latest_date.strftime("%d-%m-%Y"))
            print(next_date.strftime("%d-%m-%Y"))
            print((next_date - latest_date).days)
            print(today.day)
            
            while  pd.Timestamp(today)  >=  pd.Timestamp(next_date) :
                response = requests.get("https://pro-api.coingecko.com/api/v3/coins/wrapped-solana/history?date="+next_date.strftime("%d-%m-%Y") + "&x_cg_pro_api_key=CG-F3PXm3JzJRLx48C6cvfMvvrk")
                json_data = json.loads(response.text)
                print("fetched ", json_data['market_data']['current_price']['usd'])
                
                df.loc[-1] = [json_data['id'], next_date, json_data['market_data']['current_price']['usd']]  # adding a row
                df.index = df.index + 1  # shifting index
                df = df.sort_index()  # sorting by index
                
                next_date = next_date + datetime.timedelta(days=1)
                               
                
            #print(df)
            df['date'] = df['date'].dt.strftime('%d-%m-%Y')
            #print(df)
            
            df.to_json('wrapped-solana.json', orient='records')
            print(datetime.datetime.now(), "updated json data, latest date:", df.date[0])
            time.sleep(3600)



        except KeyboardInterrupt:
            print('interrupted!', file=open(file_path, "a"))
            break
        except Exception as e:
            print("XY2Z", e)
              


if __name__ == "__main__":
        main()


