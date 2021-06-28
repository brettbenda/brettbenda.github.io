import json
import csv
import sys

##1=use previously made segments, 0=merge to one MEGA segment
useSinaMethod=0;
if len(sys.argv)>1:
	useSinaMethod=sys.argv[1];

##docs[set#][#]
docs = []

##item[set#][participant#][#]
logs = []
segments = []

path1 = "ProvSegments/Dataset_" #dataset num
path2 = "/User Interactions/"
path21 = "/Segmentation/"
path3 = "_P" #user num
path4 = "_InteractionsLogs.json"
path41 = "_20_4_6_Prov_Segments.csv"

def setToString(i):
    if (i==1):
        return "Arms"
    elif (i==2):
        return "Terrorist"
    else:
        return "Disappearance"

#Open doc JSON
with open('ProvSegments/Dataset_1/Documents/Documents_Dataset_1.json', encoding="utf8") as file:
    docs.append(json.load(file))
with open('ProvSegments/Dataset_2/Documents/Documents_Dataset_2.json', encoding="utf8") as file:
    docs.append(json.load(file))
with open('ProvSegments/Dataset_3/Documents/Documents_Dataset_3.json', encoding="utf8") as file:
    docs.append(json.load(file))

#Open log/segment JSON
for i in range (1,4):
	#empty sets of interactions and segments
    setlogs = []
    setsegments = []
    for j in range (1,9):
    	#raw interaction logs
        with open(path1+str(i)+path2+setToString(i)+path3+str(j)+path4) as file:
            file_json = json.load(file)
            setlogs.append(file_json)

        #prepocesses segments
        with open(path1+str(i)+path21+setToString(i)+path3+str(j)+path41) as file:
            reader = csv.DictReader(file)
            csvjson = [json.dumps(d) for d in reader]
            setsegments.append(csvjson);

    #push entire collections
    logs.append(setlogs)
    segments.append(setsegments)

#Create segment JSON, cluster short segments into previous segments
segment_json = []
min_segment_length = 0

#three data sets
for _set in range(0,3):
	#8 participants per set
    for _id in range(0,8):

    	#init values
        current_segment = 0
        new_segment = True;
        segment_start = 0;
        segment_end = 0;

        #empty set
        current_segment_json = []

        #for all segments from the preprocessed set
        for i,segment in enumerate(segments[_set][_id]):
        	#read current as json
            stringjson = json.loads(segment)

            #either use a minimum segment size (to collapose small segments into neighbors)
            #OR use inf to collapse them all into one segment
            if(useSinaMethod=="1"):
                min_segment_length = float(json.loads(segments[_set][_id][-1])['end'])/24
            else:
                min_segment_length = 10000000000000000000000000.0

            #get start and and of current
            segment_start = int(float(stringjson['start']))
            segment_end = int(float(stringjson['end']))

            #first segment will always exist, update end if current segment that is short
            if(current_segment!=0 and segment_end-segment_start < min_segment_length):
                current_segment_json[current_segment-1].update({'end' : segment_end})
			#save last segment specifically
            elif(i==len(segments[_set][_id])-1): 
                item = {}
                item.update({"dataset" : _set+1})
                item.update({"pid" : _id+1})
                item.update({"sid" : current_segment})
                item.update({"start" :  int(segment_start)})
                item.update({"end" : int(segment_end)})
                item.update({"length" : int(segment_end-segment_start)})
                item.update({"interactionCount" : 0})
                current_segment_json.append(item)
                current_segment = current_segment+1
        	#save intermediary segment    
            else: 
                item = {}
                item.update({"dataset" : _set+1})
                item.update({"pid" : _id+1})
                item.update({"sid" : current_segment})
                item.update({"start" :  int(segment_start)})
                item.update({"end" : int(segment_end)})
                item.update({"length" : int(segment_end-segment_start)})
                item.update({"interactionCount" : 0})
                current_segment_json.append(item)

                current_segment = current_segment+1
        for segment in current_segment_json:
            segment.update({"length" : int(segment['end']-segment['start'])})
            segment_json.append(segment)

#count number of items that WOULD be in the segment.
_segment = 1;
for _set in range(0,3):
    for _id in range(0,8):
        # print(_set, _id)
        for item in logs[_set][_id]:

            item.update({'dataset' : _set+1})
            item.update({'PID': _id+1})

            for segment in segment_json:
                if(item['time']/10 >= segment['start'] and item['time']/10 <= segment['end'] and segment['pid']==_id+1 and segment['dataset']==_set+1):
                    item.update({'segment' : segment['sid']})
                    segment.update({"interactionCount" : segment["interactionCount"]+1})



final_json = {}



final_json.update({"segments": segment_json})


final_json.update({'interactionLogs' : logs})


#with open('test.json', 'w') as json_file:
print(json.dumps(final_json, indent=4))