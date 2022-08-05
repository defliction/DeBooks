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
            print(datetime.datetime.now(), "starting")
            df = pd.read_json(f'wrapped-solana.json', convert_dates=False)
            df.date = pd.to_datetime(df.date, format='%d-%m-%Y')
            #print(df)
            latest_date = df.date.max()
            next_date = latest_date + datetime.timedelta(days=0)
            today = datetime.date.today()
            #print(latest_date.strftime("%d-%m-%Y"))
            #print(next_date.strftime("%d-%m-%Y"))
            #print((next_date - latest_date).days)
            #print(today.day)
            print("last ", latest_date, "next ", pd.Timestamp(next_date), "today ", pd.Timestamp(today))
            while  pd.Timestamp(today).date() >=  pd.Timestamp(next_date).date() :
                response = requests.get("https://pro-api.coingecko.com/api/v3/coins/wrapped-solana/history?date="+next_date.strftime("%d-%m-%Y") + "&x_cg_pro_api_key=CG-F3PXm3JzJRLx48C6cvfMvvrk")
                json_data = json.loads(response.text)
                print(datetime.datetime.now(), "fetched ",next_date.strftime("%d-%m-%Y"), json_data['market_data']['current_price']['usd'])
                
                
                
                if pd.Timestamp(latest_date).date() ==  pd.Timestamp(next_date).date():
                    print("same dates, slicing previous value")
                    df = df.iloc[1:, :]
                #df.loc[-1] =   # adding a row
                list = [json_data['id'], next_date, json_data['market_data']['current_price']['usd']]
                new_row = pd.DataFrame(columns=['id', 'date', 'usd'], data=[list])
                df = pd.concat([df, new_row], axis=0)
                #df.index = df.index + 1  # shifting index
                #df = df.sort_index()  # sorting by index
                next_date = next_date + datetime.timedelta(days=1)
                
                    
                               
            df = df.sort_values(by=['date'], ascending=False)
            #print(df)
            df['date'] = df['date'].dt.strftime('%d-%m-%Y')
            #print(df)
           
            df.to_json('wrapped-solana.json', orient='records')
            #print(df)
            print(datetime.datetime.now(), "updated json data, latest date/price", df.date[0], df.usd[0])
            time.sleep(3600)



        except KeyboardInterrupt:
            print(datetime.datetime.now(), 'interrupted!', file=open(file_path, "a"))
            break
        except Exception as e:
            print(datetime.datetime.now(), "XY2Z", e)
              


if __name__ == "__main__":
        main()


