KIRK, ALFONSO  0:07
Okay, so if not, sometimes there, because of connectivity, I may have to download it and send a link to it. So let me know if you can't get access to it.

MTR-IL-Tel Aviv-114 Yigal Alon St-26-New York - Room 24 (Seats 24)-DP  0:08
Which one?
Yeah, sure. We will. Thanks.

KIRK, ALFONSO  0:19
Okay. Okay, great. So I'll start. So and Phil, if you could load up just real quick. So thanks for the follow up because we wanted to make certain that we touch bases to make certain that you are were cared for. We we we don't believe the short of it is we don't believe that in the 752 upgrade that
you're impacted, but I say don't believe because it's still not completely clear to us all of the fields that you're using for all of the APIs. So we can tell, we're going to tell you what changed and then you can tell us if you are impacted. We don't think so, but you guys will be the ultimate.
judge of that. So, Phil, can you give them the overview of the changes?

WISSEMAN, PHILIP  1:11
Yes, so.
I kind of broke this down into immediate and kind of longer term. So in terms of the immediate upgrade from 751 to 752, there should be no impacts. There were no model schema changes between those two releases.
As far as our other OS systems, we only are doing regression testing. There was no code development needed on any of our OS systems for this upgrade. The
The one field that they did add to the model, and you know, technically in 752 was for the greater than 27 Db spans, but that was already back ported to patch 4751, so...

MTR-IL-Tel Aviv-114 Yigal Alon St-26-New York - Room 24 (Seats 24)-DP  1:52
You.

WISSEMAN, PHILIP  2:04
None of that should have, you should already have that in your network model schema for the LMX links.
UM, so...
Now, there haven't been many of those SANs deployed, but the expectation is there should be no impact there.

MTR-IL-Tel Aviv-114 Yigal Alon St-26-New York - Room 24 (Seats 24)-DP  2:16
Yeah.

WISSEMAN, PHILIP  2:23
as far as the future, 752 enables two key capabilities that we will be deploying next year in the Metro Open Roadm, not associated with Artemis, but if you're pulling data out of ENC, you may see some things that
haven't been populated. So the model schema has not changed, but there are some things that are being populated that have not been seen before. So the first one is for remote transponders.
And this is where we don't, I don't really know the level of detail because these do get down to be pretty detailed. So we are going to be deploying remote transponder devices at customer prem locations using an in-band management GCC 0 channel.
to communicate. So FFA is supposed to start sometime in January, probably mid to late January.
given I believe the software drop is in mid-January.

MTR-IL-Tel Aviv-114 Yigal Alon St-26-New York - Room 24 (Seats 24)-DP  3:37
Question, quick question, Philip. So.

WISSEMAN, PHILIP  3:37
Lior.

MTR-IL-Tel Aviv-114 Yigal Alon St-26-New York - Room 24 (Seats 24)-DP  3:42
You're describing the changes in a business-oriented way, which is great. Do you plan on to show also to demonstrate the changes that we may be familiar with, which is technical one on the JSON structure?

WISSEMAN, PHILIP  3:55
Well.
I mean, I...
Yeah, I mean, I mean, the JSON structure follows the model structure. So if I open up the device model here, I can certainly show you where these are. Now, some of these, let me go back to my Word document here. So the network model, let me open up.
Here.

MTR-IL-Tel Aviv-114 Yigal Alon St-26-New York - Room 24 (Seats 24)-DP  4:27
And another thing, another another thing worth mentioning is that Noam, which was the main focal point for the last integration with Vnc, working on both with LAM and Alfonso, he moved to another project, he won't be part of the ETL team.

KIRK, ALFONSO  4:45
Ohh, ohh.

MTR-IL-Tel Aviv-114 Yigal Alon St-26-New York - Room 24 (Seats 24)-DP  4:47
In this iteration, Orel here is replacing him. That's why the knowledge need to be, you know, tied.

KIRK, ALFONSO  4:54
Ohh, got it.

WISSEMAN, PHILIP  4:56
Okay.

MTR-IL-Tel Aviv-114 Yigal Alon St-26-New York - Room 24 (Seats 24)-DP  4:58
Thanks.

WISSEMAN, PHILIP  4:58
In the back ported field that I described earlier, in the network model here under the LMX links, this is the tree view of the network model. You have the LMX attributes. This is where you see all the span loss values. And then there's this new field in blue that was back
reported from a future MSA release for max span loss allowed. And you should already have seen that on at least a few spans that have been deployed in Oklahoma for greater than 27 Db span. So this should already be out there. That's why I'm saying I don't think this should be an impact. It was already back ported to 751 patch 4.

KIRK, ALFONSO  5:39
But we'll just, I mean, this is Phil's cheat sheet that he keeps all of this. We'll just send this to you, right? I mean, he's going over it now, but it's not top secret. We can give it to you.

WISSEMAN, PHILIP  5:40
UM.

MTR-IL-Tel Aviv-114 Yigal Alon St-26-New York - Room 24 (Seats 24)-DP  5:51
Yeah, that anything that would ease up the process of aligning the old structure with a new one and making sure that the flow is, you know, not doesn't have any regression issues, that would be good. And please remind me, Philip, you are demonstrating the changes which are

WISSEMAN, PHILIP  5:52
Yeah, I mean.

MTR-IL-Tel Aviv-114 Yigal Alon St-26-New York - Room 24 (Seats 24)-DP  6:10
in colors here from which version to which version? Is it the minor upgrade or?

WISSEMAN, PHILIP  6:15
Well, that's why I'm scrolling to the top. So this first one is in 752. So this is 752 in this column A. I'm using this for the future stuff we're working on for next year. Next year, there's going to be an enormous amount of changes because we're introducing MSA version 17.1 in
Vnc, it'll be 812 that we roll out probably middle of next year. That, as you'll see in here, are, this is just the network model changes and there are a lot of changes in here. So that one's going to have a big impact. We will have to work with you guys
throughout starting probably early next year to prepare for that upgrade. And that's actually on our, we're working on the future requirements for this upgrade for next year now. And we've already made note of the ETL impacts that that will have. So

MTR-IL-Tel Aviv-114 Yigal Alon St-26-New York - Room 24 (Seats 24)-DP  7:06
So...

WISSEMAN, PHILIP  7:10
We will be working with you on that one quite a bit.

MTR-IL-Tel Aviv-114 Yigal Alon St-26-New York - Room 24 (Seats 24)-DP  7:14
Thank you, thank you. So the timeline is January something.

WISSEMAN, PHILIP  7:15
But, yeah.
Well, January for 7.5.2, we probably won't upgrade to 8.1 until probably closer to third quarter, early third quarter maybe. So we've got a lot of time to work on 8.1. We're just now writing our OS development features now.

MTR-IL-Tel Aviv-114 Yigal Alon St-26-New York - Room 24 (Seats 24)-DP  7:29
I feel wrong.
And...

WISSEMAN, PHILIP  7:39
We won't start our internal development probably until February. And we will be working with you all around that same time, starting then.

KIRK, ALFONSO  7:48
So, so, and when you when Liv, when you ask about January, it's we we're deploying this 752 in two week next weekend, but what Phil is saying next year in January, that's when you the the the features where.
we start to value those new elements in that MSC array. You won't see those show up until we start the FFA for those new features like the remote transponder and those features. You won't see that until we start the FFA, which is currently scheduled.
for sometime in late January or so. That's what he's getting. Okay.

MTR-IL-Tel Aviv-114 Yigal Alon St-26-New York - Room 24 (Seats 24)-DP  8:34
Okay, then regarding the 752, Philip, when would we see, as you know, we are working with a blog container that will consist of those JSON files encapsulated in a zip folder. So when we are anticipated to see those JSON files containing the 752 changes?

WISSEMAN, PHILIP  8:35
Yeah, so.

MTR-IL-Tel Aviv-114 Yigal Alon St-26-New York - Room 24 (Seats 24)-DP  8:57
Will it be in a week or two weeks from now?

WISSEMAN, PHILIP  8:58
No, that's what.
That's what we were saying is the...
even when we upgrade to 752 in December in a couple weeks, you shouldn't see any changes at that time because there were no schema changes from what was in 751 until we implement the new capabilities starting in January. So in December,
That's why I broke this up this way. The immediate impact is basically nothing. You shouldn't see any changes when we make the actual upgrade. It's only when we start deploying these new types of devices that you will see field populated that you haven't seen before.

MTR-IL-Tel Aviv-114 Yigal Alon St-26-New York - Room 24 (Seats 24)-DP  9:41
OK, great.

WISSEMAN, PHILIP  9:42
and or populated with values that you haven't seen before.
Yeah.

MTR-IL-Tel Aviv-114 Yigal Alon St-26-New York - Room 24 (Seats 24)-DP  10:02
Yeah.

KIRK, ALFONSO  10:03
we're going to start deploying those new remote transponders. That's the first time that you'll see any data changes. You won't see anything next week.

MTR-IL-Tel Aviv-114 Yigal Alon St-26-New York - Room 24 (Seats 24)-DP  10:14
Okay, good.

KIRK, ALFONSO  10:15
Does that make, does that make sense, guys?

WISSEMAN, PHILIP  10:16
And, and so...

MTR-IL-Tel Aviv-114 Yigal Alon St-26-New York - Room 24 (Seats 24)-DP  10:19
Yeah, makes sense.

KIRK, ALFONSO  10:20
Okay, okay.

WISSEMAN, PHILIP  10:22
And so on these other data changes, I'll go through these. I don't know that there's any actual impact because they are buried down pretty deep in the device model. So the first one on these remote transponders, we will be provisioning a new interface type. Now you've been receiving interfaces
you know, of various types, you know, all along. So in the
MSA model, you will get a new interface type called software loopback. And I don't even know that it's just an Ethernet interface. It's just a type of software loopback. So it's probably not even going to show up in the structure as a different interface type.
So, the...
I mean, I can send out a slide deck with a little bit more detail, but it's going to show up. Actually, I had a sample slide. Here's a sample deck. So you're going to you're going to end up seeing this is a sample of what this is going to look like. You're going to see an interface with the name of loopback one, and it's going to have this new type.
that you haven't seen before of software loopback. And it basically just contains the IP address of this device in a loopback interface. The other, if I go back to my Word document, so that's this first one. You'll see
a new interface type of GCC interface. So this is our GCC communications channel. And so this is, if I go back to that sample,
So all of these interfaces are normal interfaces you see on a wavelength service. And so for a wavelength, this type of wavelength, you'll see this interface GCC, and it's implementing this GCC channel type. So this is brand new. Never seen this before in anything we provisioned up to date.

MTR-IL-Tel Aviv-114 Yigal Alon St-26-New York - Room 24 (Seats 24)-DP  12:41
Yes, I do.

WISSEMAN, PHILIP  12:48
And so it's just an internal communication channel for this wavelength. On those wavelengths that have that communication channel, the cliffy, the service name will have a different factor.
type. That's the second term in the cliffy that has a G on it to indicate that it's got GCC 0 activated on that channel. Again, you're already ingesting the cliffy. This is just a different value in there, so they should have no actual impact on you. And then
The other is these routing instances. So you'll see for the first time a routing container with, this is giving a static route for this, you know, referencing the GCC 0 interface. You'll see a similar thing on the transponder equipment.

MTR-IL-Tel Aviv-114 Yigal Alon St-26-New York - Room 24 (Seats 24)-DP  13:45
But they are not known of the Eta data.

WISSEMAN, PHILIP  13:46
In the Central Office.
So, was there a question?

MTR-IL-Tel Aviv-114 Yigal Alon St-26-New York - Room 24 (Seats 24)-DP  13:55
So, yes, this, yeah, no, no, it's, yeah, no, no, I'm sorry, yeah, I'm sorry.
Please go on.

WISSEMAN, PHILIP  14:02
So again, I don't know that you get down to this level of detail in anything that you absorb, but you know, this is a container that has not been populated before. So that's it for the remote transponder impacts.
Well, similar impacts on the on the, there will be a static route on the.
Transponder device in the central office as well, and the GCC interface there.
The for the other large capability that's being added in 752 is for multi port optics and breakout cables. The date for deployment of this is still to be determined. I haven't seen any definitive date. I think there's some
questions about what's actually going to be available in terms of the optics for the hardware. So I haven't seen a date for when we would first deploy this, but I would think earliest is sometime first half next year. I don't know, Alfonso, if we have anything better, we can provide on a date

KIRK, ALFONSO  15:13
Yeah, no, I don't think so. I don't think so. As Phil said, that's, I mean, it's part of it is us deploying the code in the controller and in the OSSs. We control that. The other part of this is being able to manage the

WISSEMAN, PHILIP  15:15
There.

KIRK, ALFONSO  15:33
the network elements that get deployed and when they get deployed, and that's something that we don't have direct control over. So we always, the controller and the OSSs that I control, we have to be in place before the devices show up. Optimally, they show up around the same time.
but that's what Phil is saying. Right now, we're gonna, I mean, we know the timelines on the code with the controller and the OSS. The devices, that's still open as we speak right now, but that'll, it'll show up over the next few months. We just can't tell you right now.

MTR-IL-Tel Aviv-114 Yigal Alon St-26-New York - Room 24 (Seats 24)-DP  16:12
Okay, yeah, is it possible to share this document with us?

KIRK, ALFONSO  16:14
But to be clear, yeah, but to be clear, you won't see anything in your ETL, you won't see any data that shows up differently with these aspects until we start deploying these features in the production network. So we're going to.
I mean, you'll be, you know, you'll be well ready for this stuff when it shows up.

WISSEMAN, PHILIP  16:43
So, UM.

MTR-IL-Tel Aviv-114 Yigal Alon St-26-New York - Room 24 (Seats 24)-DP  16:44
Open.

WISSEMAN, PHILIP  16:46
And on these, there's two flavors I've mentioned here, multi-port and the breakout cables. Multi-port is actually similar to what we're already deploying in the Artemis. It's A 2 by 400 gig optic is the first one that we will see. It will have ports one and two. So right now, all of our optics have one port.
you'll start seeing an optic with two ports on it. And other than that, it looks exactly the same. If you go to the device model, you'll have, you know, the optic circuit pack and then it will list its ports and you'll see port
one in port 2 listed there with exactly the same sort of data that you have today for those 400 gig ports. The other one is the breakout cable. Now the breakout cable will

MTR-IL-Tel Aviv-114 Yigal Alon St-26-New York - Room 24 (Seats 24)-DP  17:32
Dinh.

WISSEMAN, PHILIP  17:41
have child ports. Now, I believe some of the vendors model have MPO cables internal to the Roadm nodes where they have, they may have modeled the sub ports on that MPO table as child ports so that there's a parent port populated. But this is the first time you'll see it on a
On a on an optic that's externally facing for a service, so...
Again, in the going back to the device model, you come down here and it's this parent port container will be populated on that port for the child port. So what you would see is on that one optic, you would see a list of ports. There would be
Port one, which is the parent port, and then... UM.
Or, and they...
in the example I showed here, the one we expect to, well, we're either going to deploy 8 by 100 gig or 4 by 100 gig optics. And so you will see the child ports numbered as 1.1 through 1.8 for the eight by. And so each of these child ports
So that one object would end up having nine ports listed. The first one will be the parent port, and then each of these child ports would have that parent port container populated, referencing back to it. These ports will also show up
UM in.
The additional ports, again, no real data change, but if you scroll down all the way to the Exponder container.
here. So this exponder container lists all of the ports that are part of that exponder. In this case, it would be a much sponder. And so these ports would list all of those ports down here as well, referencing back to the
the circuit pad data in the device model. So you'll see a lot more ports within an Exponder, but again, that's not really that much different from a data structure perspective than what you've seen before. The services that ride those will still just reference the port and the interfaces on those ports, so no real difference there at all.
The only difference is that I'm expecting from 752. These are the two main features that come in. Lam, I know I don't believe there was anything else in 752 feature list that looked like it would impact anything.

DINH, LAM S  20:40
Yeah, correct.

KIRK, ALFONSO  20:44
So while we're thinking about it, let me, let me, let me, Lam, Orel, and Orel, I'm not certain if you know this yet, but where are they, are they pulling this data from Snowflake now, or where are we posting this?

WISSEMAN, PHILIP  20:45
UM.

KIRK, ALFONSO  21:04
this output from Vnc.

Eliyahu, Orel  21:10
As far as.

DINH, LAM S  21:10
UM, I...
I put on a shirt drive for Noam on fountain.

KIRK, ALFONSO  21:19
Okay, that's still where you guys are getting this from.
From a shared drive, we're not pulling this from Snowflake yet.

MTR-IL-Tel Aviv-114 Yigal Alon St-26-New York - Room 24 (Seats 24)-DP  21:28
By the way, we will Alfonso, we will want to really evaluate the option to take this data from the from the snowflake.

KIRK, ALFONSO  21:39
Okay, I mean, I mean...

MTR-IL-Tel Aviv-114 Yigal Alon St-26-New York - Room 24 (Seats 24)-DP  21:40
If we can, if we can bring the data, this is your, this is our normal processing flow, we extracting data usually from the DBMS, right, like Oracle, Postgres, Snowflake.
Right. So it's a kind of exception that we are getting the data in the JSON as a files. And by the way, we are flatting the data into the Postgres tables.
So, we will have a way, and if you can confirm that you do have the Vnc data already resided in the snowflake, so we would we probably will evaluate an option to to take this data and extract the data from the snowflake rather than from the files.

KIRK, ALFONSO  22:30
I mean, I think that might be what we'll do in the future, but if Lam say that that's what we're still, if we're still pushing this to Gnomes, a shared drive that Gnome had set up, then let's continue that because we've got 752 going.
Next weekend, we'll continue that. But in the very near future, we can look at improving that process. Because even now, if we push it over to Snowflake, we're not translating anything. It would still be in exactly the same format.

MTR-IL-Tel Aviv-114 Yigal Alon St-26-New York - Room 24 (Seats 24)-DP  23:06
But I've got to get it. No, it's definitely not for the 752. This is not. It's just, you know, we are, again, we're going to have to learn the data. We want to understand the data for the snowflakes already. It's not the first week or two. Okay, so we can start if they know aside and even look.

KIRK, ALFONSO  23:10
Yeah.

MTR-IL-Tel Aviv-114 Yigal Alon St-26-New York - Room 24 (Seats 24)-DP  23:28
In this data from the snowflake, but definitely this is not the project of 72752.

KIRK, ALFONSO  23:34
I, I agree. I think we agree. Yep, agreed.
We will fill, let's find a folder on our shared drive and post this, both your cheat sheet that goes into 8.1.
as well as the 751 versus 752 comparisons that you just walked through with this overview. Let's post it out on our shared drive and then we'll provide a link to Alex and Orel and the ETL team.

MTR-IL-Tel Aviv-114 Yigal Alon St-26-New York - Room 24 (Seats 24)-DP  24:21
That it would be helpful. Thank you.
Okay, then.
Okay, so thank you very much. Thank you very much. Appreciate it. It was pretty clear. Probably we'll meet somewhere in the beginning of January, maybe.
Before they pay.

KIRK, ALFONSO  24:46
Sure, sure. Yeah, we'll keep you in the loop with that and we can meet. And also, I think it will, it's not imminent, but I think going forward, and maybe this is a good time as Orel, you know, picks up from Noam.

MTR-IL-Tel Aviv-114 Yigal Alon St-26-New York - Room 24 (Seats 24)-DP  24:47
Um, Pss.
Mhm.

KIRK, ALFONSO  25:05
Maybe it'll be good every so often, certainly not every week or not even every two weeks, but maybe once a month or whatever week, you can kind of walk us through how you are. I mean, we know very little about how you are translating this data into your models.
right? We worked with you guys about this time last year, I believe, to get all of this worked, all of this work done in the 1st place. But then we kind of go off and you guys have done your work and we really kind of don't know exactly how you made some of those transformations.
Technically, it shouldn't impact the work that we're doing, but the more we know about, you know, how you're using the data, the more help we can give you as this data becomes more and more complicated.

WISSEMAN, PHILIP  25:59
And one other comment there is those earlier discussions were focused solely on the service hierarchy and the services. And we really haven't seen exactly what amount of the device model data you are actually ingesting. And

KIRK, ALFONSO  25:59
So, that's maybe, yeah, yeah, go ahead, Phil.

WISSEMAN, PHILIP  26:17
and what level of granularity you get to, especially when it comes to internal data within some of the devices that don't directly map to services and so forth, and some of these interfaces and protocols. So it'd be good to know what you all are using.

Ezer, Liav  26:36
What do I miss?
Guys, you know, a suggestion, maybe following your input, maybe we should create another meeting next week.
after gathering all this information and translating it into action items for us. And also, you know, adopting your will to be part of this process to understand it in order for the integration in the future to be more smooth.
So, and Alex, if you would be able to create this kind of scheduled meeting and add product personnel like Gil.
Please?

MTR-IL-Tel Aviv-114 Yigal Alon St-26-New York - Room 24 (Seats 24)-DP  27:23
Yeah, sure.

Ezer, Liav  27:26
Is it okay guys, Alfonso, Philip?

WISSEMAN, PHILIP  27:31
Yeah, that's fine. That would actually help with, as we start working these 8.1 details, understanding what your, what the impacts are going to be on the ETL process there as well, because those are much, much bigger changes.

KIRK, ALFONSO  27:31
Sure, yeah, sure.

WISSEMAN, PHILIP  27:49
Than what I described here.

Ezer, Liav  27:55
Thanks.

MTR-IL-Tel Aviv-114 Yigal Alon St-26-New York - Room 24 (Seats 24)-DP  27:55
Okay.

Ezer, Liav  27:58
Orel, do you have any questions?
Or do you need any?

Eliyahu, Orel  28:03
UM.

Ezer, Liav  28:04
Who would be the focal point?

Eliyahu, Orel  28:05
No, I don't have any clue.

Ezer, Liav  28:08
Yeah, sorry, Orel, who would be the focal point for Orel? Any on technical side on your end?
Alfonso, maybe you can refer us to the focal point that Orel might counter into his questions, and he can address them using this focal point.

WISSEMAN, PHILIP  28:33
No, that would.

KIRK, ALFONSO  28:37
Yeah, for now, yeah, yeah, for now, that's Phil and Lum. I mean, we're trying to transition this work, but for now, that's Phil and Lum.

WISSEMAN, PHILIP  28:37
I would expect that would be me.

Eliyahu, Orel  28:47
Okay.

KIRK, ALFONSO  28:50
Yeah.

Ezer, Liav  28:53
Thanks, I I think we can wrap that this up now.

Eliyahu, Orel  29:00
Okay, thanks.

MTR-IL-Tel Aviv-114 Yigal Alon St-26-New York - Room 24 (Seats 24)-DP  29:00
Yeah, OK. Thank you very much.
So, I'll set up a meeting for next week, then will present you the Itiel process.

KIRK, ALFONSO  29:03
Thanks, guys.

Ezer, Liav  29:04
Have a great day.

KIRK, ALFONSO  29:09
Sure. You know what? Let's do this, Alex. Let's, I don't think it's imminent. Let us get through the upgrade and let's schedule it maybe for early December.

Ezer, Liav  29:10
Yeah, yeah.

KIRK, ALFONSO  29:23
When you've got more of our attention. I mean, there's nothing imminent going to happen right now. So when you've got more of our attention, yeah. I mean, we got holidays coming up and we've got all of these migrations. It's A lot. So let's do it first week in December or so.

MTR-IL-Tel Aviv-114 Yigal Alon St-26-New York - Room 24 (Seats 24)-DP  29:23
Okay, sure.

Eliyahu, Orel  29:24
Polhemus.

MTR-IL-Tel Aviv-114 Yigal Alon St-26-New York - Room 24 (Seats 24)-DP  29:28
Yeah, yeah, yeah, sure.
OK.
Yes.
Okay, so please send an invite from your computer based on your available time, yeah, and we will.

KIRK, ALFONSO  29:44
I'll do that.
I'll do that.

MTR-IL-Tel Aviv-114 Yigal Alon St-26-New York - Room 24 (Seats 24)-DP  29:48
But then it, thanks.

KIRK, ALFONSO  29:50
For sure. All right. And by then, you'll be able to verify what we said is true, that your data won't show up, any of this won't show up in the data that you're pulling. So, okay. All right. I'll do that in the first week in December. We'll talk then. All right.

Ezer, Liav  29:51
Thanks, everyone.

MTR-IL-Tel Aviv-114 Yigal Alon St-26-New York - Room 24 (Seats 24)-DP  29:57
Yeah.
Like a plan? Thank you.

KIRK, ALFONSO  30:09
Thanks, guys. Sure, sure.

Ezer, Liav  30:11
Thank you, guys. Have a good day.

MTR-IL-Tel Aviv-114 Yigal Alon St-26-New York - Room 24 (Seats 24)-DP  30:12
Thank you. Have a good day, though. Bye bye.
Thank you very much.