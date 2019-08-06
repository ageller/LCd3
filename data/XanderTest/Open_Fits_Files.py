#!/usr/bin/env python
# coding: utf-8

# In[1]:


##Open and read the fits files for Aaron
import numpy as np
import math
import pandas as pd
from astropy.io import fits
import astropy
import matplotlib.pyplot as plt
import scipy, pylab
import matplotlib.patches as mpatches
import matplotlib.path as path
from matplotlib.ticker import MultipleLocator
from matplotlib.patheffects import AbstractPathEffect
import copy
from matplotlib.colors import LogNorm
import random
import csv
import scipy
import scipy.optimize
import matplotlib.pyplot as plt
from scipy import interpolate
from scipy import integrate
from astropy.table import Table
import tarfile as tf
import os
import subprocess
import sys


# In[2]:


#fill in the directory of whatever you need
Atlas_LC = Table(astropy.io.fits.getdata(r"All_Big_Macc_LC_Data_xhall.fit"))


# In[3]:


Directory_File = Table.read("Aaron_Stars_2.csv")


# In[16]:


def get_lcdata_from_objid(objid):
    objid = int(objid)
    observations = Atlas_LC[np.where(objid == Atlas_LC["objid"])[0]]
    hjd = np.array(observations['mjd'])
    mag = np.array(observations['m'])
    mag_unc = np.array(observations['dm'])
    filters = np.array([byte for byte in observations['filter']])
    return hjd, mag, mag_unc, filters


# In[17]:


get_lcdata_from_objid((Directory_File["Atlas_ObjID"][0]))


# In[ ]:




