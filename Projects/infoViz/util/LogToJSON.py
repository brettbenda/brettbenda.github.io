###
###      Place this file in the same directory as your log file.
###      Run on the command line using the command 'python LogToJSON.py'. 
###      Enter the name of the file you want to process.
###      IMPORTANT: there will be an extra comma at the end of the file, after the last object and before the closing ']'. Remove it.
###

print("Enter name of UAV Drone Data to convert to JSON:")
filename = input()
file = open(filename);

out_filename = filename[0:-3] + "json"
print(out_filename)
out_file = open(out_filename,'w')
out_file.write("[\n");

### x=2, y=5, z=8, vX=11, vY=14, vZ=17, rX=20, rY=23, rZ=26, t=28
for line in file.readlines():
	line = line.split();
	out_file.write(
	"""\t{{ 
		\"x\": \"{}\",
		\"y\": \"{}\",
		\"z\": \"{}\",
		\"vX\": \"{}\",
		\"vY\": \"{}\",
		\"vZ\": \"{}\",
		\"pitch\": \"{}\",
		\"yaw\": \"{}\",
		\"roll\": \"{}\",
		\"t\": \"{}\"
	}},\n"""
		.format(line[2],line[5],line[8],line[11],line[14],line[17],line[20],line[23],line[26],line[28]))

out_file.write("]");