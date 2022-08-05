import asyncio
import ujson
import numpy as np
import pandas as pd
import multiprocessing
import os

file_path = "log_file.txt"
pairs = ["warpped-solana", "USDC", "mSOL"]


def main(): 
    while True: 
        try:
            print("XYZ")
        except KeyboardInterrupt:
            print('interrupted!', file=open(file_path, "a"))
            break
        except Exception as e:
            print("XY2Z")
              
if __name__ == "__main__":
        main()


