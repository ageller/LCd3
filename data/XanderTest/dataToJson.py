import numpy as np
import pandas as pd

def dataToJson(filterNames, colors, symbols, sizes, CMDdata, LCdata, periods,
			   multiples=[1,0.5, 2., 3.], 
			   multiplesNames=["whole","half","twice","triple"], 
			   features = None, 
			   featureRange = [[0.1, 1000], [0.01, 3]],
			   featureFormat = ['log', 'log'],
			   filename="LCdata.json")  :
	"""
	#filter names (not visible in interactive, but should be unique strings)
	filterNames = ['filt1', 'filt2']

	#colors for data in each filter
	colors = ['#dc143c','#4682b4']
	
	#symbols for each filter
	# the following are available Circle, Cross, Diamond, Square, Star, Triangle, Wye
	# NOTE: these may be case sensitive
	symbols = ['Circle', 'Cross']

	#sizes for the symbols
	sizes = [10, 10]
	
	#CMDdata should be a dict with the following keys:
	#for percentiles, all lists must be ordered in the same way (either small to large or large to small)
	CMDdata = {
	 "color" : #the mag1 - mag2 color of the object
	 "mag" : #the mag1 or mag2 value
	 "magPplus" : #a list of + percentile values for the magnitude (e.g., 90, 95, 99 confidence intervals)
	 "magPminus" : #a list of - percentile values for the magnitude (e.g., 90, 95, 99 confidence intervals)
	 "colorPplus" : #a list of + percentile values for the color (same confidence intervals as magPplus)
	 "colorPminus" : #a list of - percentile values for the color (same confidence intervals as magPminus)
	 "cs" : #the colors for each percentile
	 }
	 
	#LCdata should be a dict of dicts, one for each filter with the following keys:
	LCdata[filter] = {
		"hjd" : # a list of the hjd dates of observations
		"mag" : # a list of the magnitudes in the given "filter"
		"err" : # a list of the uncertainties on the magnitues in the given "filter 
		"r": # optional, the size of the circle for plotting (single number); default is 3
	 }
	 
	#periods for each filter (in same order as filterNames)
	periods = [1.2345,1.2346]
	
	##########
	#the following inputs are optional
	###########
	
	#multiplicative factor for the period
	multiples = [1, 0.5, 2., 3.] 
	
	#names for the buttons associated with each multiple
	multiplesNames=["whole period","half the period","twice the period","triple the period"] 

	#any data that should appear in the features spines; 
	#must include "period" first!, and ordered in the same way as filterNames
	#if "features" are not defined on input, the following features are calculated
	features = {'period':[best_period, pfac*best_period],
			'amplitude':[max(mmag) - min(mmag), max(mmag2) - min(mmag2)]}
	
	#range for axes 
	featureRange = [[0.1, 1000], [0.01, 3]] 
	
	#log vs. linear for feature spines
	featureFormat = ['log', 'log']  

	#name of the output file
	filename = "LCdata.json"
	"""
	
	#create the output dict, and begin defining values
	outDict = {}
							 
	#create LC data 
	outDict['rawData'] = []
	if (features == None):
		amplitudes = []
	minJD = 1e10
	for f in filterNames:
		minJD = min(minJD, min(LCdata[f]['hjd']))
	for i,f in enumerate(filterNames):

		if (features == None):
			amplitudes.append(max(LCdata[f]['mag']) - min(LCdata[f]['mag']))
			
		for x,y,ye in zip(LCdata[f]['hjd'], LCdata[f]['mag'], LCdata[f]['err']):
			data = {
				"x":x,
				"y":y,
				"ye":ye,
				"r":sizes[i],
				"c":colors[i],
				"s":symbols[i],
				"filter":filterNames[i]
			}
			outDict['rawData'].append(data)
		
	#create the CMD data
	#first sort the percentiles
	s = np.argsort(CMDdata['colorPplus'])
	outDict['CMDdata'] = []
	for rxp,rxm,ryp,rym,c in zip(np.array(CMDdata['colorPplus'])[s][::-1], np.array(CMDdata['colorPminus'])[s][::-1], \
								 np.array(CMDdata['magPplus'])[s][::-1], np.array(CMDdata['magPminus'])[s][::-1], \
								 np.array(CMDdata['cs'])[s][::-1]):
		data={
			"x":CMDdata['color'], 
			"y":CMDdata['mag'],
			"rxp":rxp,
			"rxm":rxm,
			"ryp":ryp, 
			"rym":rym, 
			"c":c}
		outDict['CMDdata'].append(data)

	#feature data
	if (features == None):
		features = {'period':periods, 'amplitude':amplitudes}
			   
	outDict['features'] = list(features.keys())
	outDict['featuresRange'] = featureRange 
	outDict['featuresFormat'] = featureFormat 
	outDict['featureData'] = {}
	for f in list(features.keys()):
		outDict['featureData'][f] = []
		for i,val in enumerate(features[f]):
			outDict['featureData'][f].append({
				"x":0,
				"y":val,
				"c":colors[i],
				"filter":filterNames[i]
			})


	#some additional items 
	outDict['filters'] = filterNames
	outDict['multiples'] = multiples
	outDict['multiplesNames'] = multiplesNames
	for i,f in enumerate(filterNames):
		outDict[f] = {}
		outDict[f]['color'] = colors[i]
		outDict[f]['period'] = periods[i]

	
	pd.Series(outDict).to_json(filename, orient='index')
