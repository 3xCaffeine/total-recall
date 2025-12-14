"""
Prompts for LLM extraction from journal entries.
"""

SYSTEM_PROMPT = """
You are an AI assistant specialized in extracting structured information from personal journal entries. Your task is to analyze the provided journal entry and extract the following components in a specific JSON format:

1. **metadata**: Direct metadata from the entry, including datetime, title, and timezone if mentioned.
2. **entities**: People, places, organizations, or other named entities mentioned, with IDs, names, types, and attributes.
3. **relationships**: Connections between entities, such as meetings, interactions, or associations.
4. **todos**: Actionable tasks or reminders extracted from the entry.
5. **events**: Scheduled or planned events, including meetings, appointments, or activities.

IMPORTANT: When processing dates and times:
- You will be provided with the current date and the user's timezone
- Use the current date as your reference for relative dates ("tomorrow", "next week", "Friday", etc.)
- Interpret all times in the user's timezone (e.g., "7 PM" means 7 PM in their timezone)
- All datetime values in your output must use ISO 8601 format: YYYY-MM-DDTHH:MM:SS
- Example: If current date is December 11, 2025, timezone is Asia/Kolkata, and entry says "meeting tomorrow at 3 PM", output: "2025-12-12T15:00:00"

Output must be valid JSON matching the specified structure. Use null for missing values. Assign unique IDs (e.g., "e1", "t1", "ev1") for entities, todos, and events. Be precise and only extract what's explicitly or clearly implied in the text.
"""

FEW_SHOT_EXAMPLES = """
Example 1 (Indian Context - Hinglish):
Journal Entry: "Aaj subah Priya ke saath Cafe Coffee Day, Indiranagar mein mile around 11 baje. Bahut accha discussion hua about the startup pitch deck. She suggested ki main Bangalore Startup Summit attend karu next month. Uske baad Amma ko call karna hai regarding her birthday plans - thinking of booking that new restaurant in Koramangala she was talking about. Also need to renew my Ola subscription before it expires and buy that book 'Atomic Habits' Rohan recommended. Weekend pe cousin ki shaadi hai Pune mein, train tickets book karni hai urgent. Feeling a bit stressed about the presentation on Friday but cautiously optimistic about the investor meeting. Gym jaana hai regularly, already missed 3 days this week smh."

Output:
{
  "metadata": {
    "entry_datetime": "2025-02-10T11:00:00",
    "source_title": null,
    "timezone": "Asia/Kolkata"
  },
  "entities": [
    {"id": "e1", "name": "Priya", "normalized_name": null, "type": "person", "attributes": {"relationship": "professional"}},
    {"id": "e2", "name": "Cafe Coffee Day, Indiranagar", "normalized_name": "Cafe Coffee Day", "type": "location", "attributes": {"relationship": null}},
    {"id": "e3", "name": "Amma", "normalized_name": "Mother", "type": "person", "attributes": {"relationship": "family"}},
    {"id": "e4", "name": "Restaurant in Koramangala", "normalized_name": null, "type": "location", "attributes": {"relationship": null}},
    {"id": "e5", "name": "Rohan", "normalized_name": null, "type": "person", "attributes": {"relationship": "friend"}},
    {"id": "e6", "name": "Cousin", "normalized_name": null, "type": "person", "attributes": {"relationship": "family"}},
    {"id": "e7", "name": "Pune", "normalized_name": null, "type": "location", "attributes": {"relationship": null}},
    {"id": "e8", "name": "Bangalore Startup Summit", "normalized_name": null, "type": "event", "attributes": {"relationship": null}}
  ],
  "relationships": [
    {"source": "e1", "type": "meeting", "target": "e2", "description": "Met Priya at Cafe Coffee Day to discuss startup pitch deck", "datetime": "2025-02-10T11:00:00"},
    {"source": "e5", "type": "recommendation", "target": null, "description": "Rohan recommended the book Atomic Habits", "datetime": null},
    {"source": "e6", "type": "family_event", "target": "e7", "description": "Cousin's wedding in Pune", "datetime": null}
  ],
  "todos": [
    {"id": "t1", "task": "Call Amma regarding birthday plans", "priority": "must_do", "due": null, "related_entities": ["e3"]},
    {"id": "t2", "task": "Book restaurant in Koramangala for Amma's birthday", "priority": "normal", "due": null, "related_entities": ["e3", "e4"]},
    {"id": "t3", "task": "Renew Ola subscription", "priority": "must_do", "due": null, "related_entities": []},
    {"id": "t4", "task": "Buy book 'Atomic Habits'", "priority": "nice_to_have", "due": null, "related_entities": ["e5"]},
    {"id": "t5", "task": "Book train tickets to Pune for wedding", "priority": "must_do", "due": null, "related_entities": ["e6", "e7"]},
    {"id": "t6", "task": "Go to gym regularly", "priority": "normal", "due": null, "related_entities": []}
  ],
  "events": [
    {"id": "ev1", "title": "Meeting with Priya about startup pitch", "datetime": "2025-02-10T11:00:00", "location": "Cafe Coffee Day, Indiranagar", "duration_minutes": null, "related_entities": ["e1", "e2"], "should_sync_calendar": true},
    {"id": "ev2", "title": "Bangalore Startup Summit", "datetime": null, "location": "Bangalore", "duration_minutes": null, "related_entities": ["e8"], "should_sync_calendar": true},
    {"id": "ev3", "title": "Presentation", "datetime": "2025-02-14T00:00:00", "location": null, "duration_minutes": null, "related_entities": [], "should_sync_calendar": true},
    {"id": "ev4", "title": "Investor meeting", "datetime": null, "location": null, "duration_minutes": null, "related_entities": [], "should_sync_calendar": true},
    {"id": "ev5", "title": "Cousin's wedding", "datetime": null, "location": "Pune", "duration_minutes": null, "related_entities": ["e6", "e7"], "should_sync_calendar": true}
  ]
}

Example 2 (Formal - Professional):
Journal Entry: "Attended the quarterly board meeting this morning at headquarters from 9:00 AM to 11:30 AM. Dr. Richardson presented the Q4 financial projections, which showed a 23% increase in revenue. I have been tasked with preparing a comprehensive market analysis report for the expansion into the European markets, due by March 15th. Following the meeting, I had lunch with Jennifer Martinez from the Marketing Department at The Capital Grille to discuss the upcoming product launch strategy. We identified several key action items: coordinate with the design team on finalizing packaging, schedule focus group sessions for February 20-22, and review the preliminary advertising budget. I must also remember to submit my expense reports from the San Francisco trip before the end of this week. Additionally, I need to follow up with Thomas Chen regarding the vendor contracts and confirm my attendance at the Industry Innovation Conference in Boston on March 8th. Made a note to schedule my annual performance review with Sarah before the month ends."

Output:
{
  "metadata": {
    "entry_datetime": "2025-02-10T09:00:00",
    "source_title": null,
    "timezone": null
  },
  "entities": [
    {"id": "e1", "name": "Dr. Richardson", "normalized_name": null, "type": "person", "attributes": {"relationship": "professional"}},
    {"id": "e2", "name": "Jennifer Martinez", "normalized_name": null, "type": "person", "attributes": {"relationship": "professional"}},
    {"id": "e3", "name": "Marketing Department", "normalized_name": null, "type": "organization", "attributes": {"relationship": null}},
    {"id": "e4", "name": "The Capital Grille", "normalized_name": null, "type": "location", "attributes": {"relationship": null}},
    {"id": "e5", "name": "Thomas Chen", "normalized_name": null, "type": "person", "attributes": {"relationship": "professional"}},
    {"id": "e6", "name": "Sarah", "normalized_name": null, "type": "person", "attributes": {"relationship": "professional"}},
    {"id": "e7", "name": "Headquarters", "normalized_name": null, "type": "location", "attributes": {"relationship": null}},
    {"id": "e8", "name": "San Francisco", "normalized_name": null, "type": "location", "attributes": {"relationship": null}},
    {"id": "e9", "name": "Boston", "normalized_name": null, "type": "location", "attributes": {"relationship": null}},
    {"id": "e10", "name": "Design team", "normalized_name": null, "type": "organization", "attributes": {"relationship": null}}
  ],
  "relationships": [
    {"source": "e1", "type": "presentation", "target": "e7", "description": "Dr. Richardson presented Q4 financial projections at board meeting", "datetime": "2025-02-10T09:00:00"},
    {"source": "e2", "type": "meeting", "target": "e4", "description": "Lunch meeting with Jennifer Martinez to discuss product launch strategy", "datetime": "2025-02-10T12:00:00"},
    {"source": "e2", "type": "works_at", "target": "e3", "description": "Jennifer Martinez works in Marketing Department", "datetime": null}
  ],
  "todos": [
    {"id": "t1", "task": "Prepare comprehensive market analysis report for European expansion", "priority": "must_do", "due": "2025-03-15T00:00:00", "related_entities": []},
    {"id": "t2", "task": "Coordinate with design team on finalizing packaging", "priority": "must_do", "due": null, "related_entities": ["e10"]},
    {"id": "t3", "task": "Schedule focus group sessions for February 20-22", "priority": "must_do", "due": "2025-02-20T00:00:00", "related_entities": []},
    {"id": "t4", "task": "Review preliminary advertising budget", "priority": "normal", "due": null, "related_entities": []},
    {"id": "t5", "task": "Submit expense reports from San Francisco trip", "priority": "must_do", "due": "2025-02-14T00:00:00", "related_entities": ["e8"]},
    {"id": "t6", "task": "Follow up with Thomas Chen regarding vendor contracts", "priority": "must_do", "due": null, "related_entities": ["e5"]},
    {"id": "t7", "task": "Confirm attendance at Industry Innovation Conference in Boston", "priority": "normal", "due": null, "related_entities": ["e9"]},
    {"id": "t8", "task": "Schedule annual performance review with Sarah", "priority": "must_do", "due": "2025-02-28T00:00:00", "related_entities": ["e6"]}
  ],
  "events": [
    {"id": "ev1", "title": "Quarterly board meeting", "datetime": "2025-02-10T09:00:00", "location": "Headquarters", "duration_minutes": 150, "related_entities": ["e1", "e7"], "should_sync_calendar": true},
    {"id": "ev2", "title": "Lunch with Jennifer Martinez - Product Launch Strategy", "datetime": "2025-02-10T12:00:00", "location": "The Capital Grille", "duration_minutes": null, "related_entities": ["e2", "e4"], "should_sync_calendar": true},
    {"id": "ev3", "title": "Focus group sessions", "datetime": "2025-02-20T00:00:00", "location": null, "duration_minutes": null, "related_entities": [], "should_sync_calendar": true},
    {"id": "ev4", "title": "Industry Innovation Conference", "datetime": "2025-03-08T00:00:00", "location": "Boston", "duration_minutes": null, "related_entities": ["e9"], "should_sync_calendar": true},
    {"id": "ev5", "title": "Annual performance review with Sarah", "datetime": null, "location": null, "duration_minutes": null, "related_entities": ["e6"], "should_sync_calendar": true}
  ]
}

Example 3 (Informal - Daily Journal):
Journal Entry: "Ugh what a day lol. Woke up late again (need to fix my sleep schedule seriously). Grabbed coffee with Alex around 2pm at that new place near campus - Brew Haven I think it's called? Pretty good vibes tbh. We talked about the group project that's due next week and honestly I'm lowkey stressed because I haven't even started my part yet... need to finish the research section by Thursday at the latest. Alex mentioned they're having a birthday party this Saturday night at their place, should be fun! Reminded me I gotta buy them a gift, maybe that vinyl record they were talking about last time?? 

After coffee ran into my old roommate Jamie at the bookstore which was random but nice. They're apparently moving to Portland next month for a new job, happy for them but gonna miss having them around. Oh and Mom called while I was walking home - family dinner is happening this Sunday at 6, she's making lasagna thank god because I've been living on instant ramen lately lmao. 

Still need to: email Professor Williams about extending the deadline (fingers crossed), do laundry before I literally run out of clean clothes, call the dentist to reschedule that appointment I missed last week oops, and maybe actually go to the gym?? Been saying that for like two weeks now. Also should probably start looking at apartments for next semester since our lease is up in April. Jake said he knows someone who's subletting a place in the arts district but idk if I can afford it. Anyway feeling kind of overwhelmed but we move I guess."

Output:
{
  "metadata": {
    "entry_datetime": "2025-02-10T14:00:00",
    "source_title": null,
    "timezone": null
  },
  "entities": [
    {"id": "e1", "name": "Alex", "normalized_name": null, "type": "person", "attributes": {"relationship": "friend"}},
    {"id": "e2", "name": "Brew Haven", "normalized_name": null, "type": "location", "attributes": {"relationship": null}},
    {"id": "e3", "name": "Jamie", "normalized_name": null, "type": "person", "attributes": {"relationship": "friend"}},
    {"id": "e4", "name": "Bookstore", "normalized_name": null, "type": "location", "attributes": {"relationship": null}},
    {"id": "e5", "name": "Portland", "normalized_name": null, "type": "location", "attributes": {"relationship": null}},
    {"id": "e6", "name": "Mom", "normalized_name": "Mother", "type": "person", "attributes": {"relationship": "family"}},
    {"id": "e7", "name": "Professor Williams", "normalized_name": null, "type": "person", "attributes": {"relationship": "professional"}},
    {"id": "e8", "name": "Jake", "normalized_name": null, "type": "person", "attributes": {"relationship": "friend"}},
    {"id": "e9", "name": "Arts district", "normalized_name": null, "type": "location", "attributes": {"relationship": null}}
  ],
  "relationships": [
    {"source": "e1", "type": "meeting", "target": "e2", "description": "Had coffee with Alex at Brew Haven to discuss group project", "datetime": "2025-02-10T14:00:00"},
    {"source": "e3", "type": "chance_encounter", "target": "e4", "description": "Ran into old roommate Jamie at bookstore", "datetime": "2025-02-10T15:00:00"},
    {"source": "e3", "type": "life_update", "target": "e5", "description": "Jamie is moving to Portland next month for a new job", "datetime": null}
  ],
  "todos": [
    {"id": "t1", "task": "Finish research section for group project", "priority": "must_do", "due": "2025-02-13T00:00:00", "related_entities": []},
    {"id": "t2", "task": "Buy birthday gift for Alex (vinyl record)", "priority": "must_do", "due": "2025-02-15T00:00:00", "related_entities": ["e1"]},
    {"id": "t3", "task": "Email Professor Williams about deadline extension", "priority": "must_do", "due": null, "related_entities": ["e7"]},
    {"id": "t4", "task": "Do laundry", "priority": "must_do", "due": null, "related_entities": []},
    {"id": "t5", "task": "Call dentist to reschedule missed appointment", "priority": "normal", "due": null, "related_entities": []},
    {"id": "t6", "task": "Go to the gym", "priority": "nice_to_have", "due": null, "related_entities": []},
    {"id": "t7", "task": "Start looking at apartments for next semester", "priority": "normal", "due": null, "related_entities": []},
    {"id": "t8", "task": "Follow up with Jake about arts district apartment sublet", "priority": "normal", "due": null, "related_entities": ["e8", "e9"]},
    {"id": "t9", "task": "Fix sleep schedule", "priority": "nice_to_have", "due": null, "related_entities": []}
  ],
  "events": [
    {"id": "ev1", "title": "Coffee with Alex", "datetime": "2025-02-10T14:00:00", "location": "Brew Haven", "duration_minutes": null, "related_entities": ["e1", "e2"], "should_sync_calendar": false},
    {"id": "ev2", "title": "Alex's birthday party", "datetime": "2025-02-15T20:00:00", "location": "Alex's place", "duration_minutes": null, "related_entities": ["e1"], "should_sync_calendar": true},
    {"id": "ev3", "title": "Family dinner", "datetime": "2025-02-16T18:00:00", "location": null, "duration_minutes": null, "related_entities": ["e6"], "should_sync_calendar": true},
    {"id": "ev4", "title": "Group project due", "datetime": "2025-02-17T00:00:00", "location": null, "duration_minutes": null, "related_entities": [], "should_sync_calendar": true}
  ]
}
"""


def build_extraction_prompt(journal_content: str, current_date: str, timezone: str = "UTC") -> str:
    """
    Build the extraction prompt with current date and timezone context.
    
    Args:
        journal_content: The journal entry content to extract from
        current_date: Current date in format "Month DD, YYYY" (e.g., "December 11, 2025")
        timezone: User's timezone (e.g., "Asia/Kolkata", "America/New_York")
    
    Returns:
        Formatted prompt string with date and timezone context
    """
    from datetime import datetime, timedelta
    
    # Parse the current date to calculate tomorrow
    current_dt = datetime.strptime(current_date, "%B %d, %Y")
    tomorrow_dt = current_dt + timedelta(days=1)
    
    # Format dates with day of week for clarity
    current_formatted = current_dt.strftime("%A, %B %d, %Y")  # e.g., "Thursday, December 12, 2025"
    tomorrow_formatted = tomorrow_dt.strftime("%A, %B %d, %Y")  # e.g., "Friday, December 13, 2025"
    current_iso_date = current_dt.strftime("%Y-%m-%d")  # e.g., "2025-12-12"
    tomorrow_iso_date = tomorrow_dt.strftime("%Y-%m-%d")  # e.g., "2025-12-13"
    
    return f"""CURRENT DATE, TIME, AND TIMEZONE CONTEXT:
📅 TODAY is {current_formatted} (date: {current_iso_date})
📅 TOMORROW is {tomorrow_formatted} (date: {tomorrow_iso_date})
🌍 User's timezone: {timezone}

CRITICAL INSTRUCTIONS FOR DATE INTERPRETATION:
1. When the entry mentions "today" → use date {current_iso_date}
2. When the entry mentions "tomorrow" → use date {tomorrow_iso_date}
3. When the entry mentions a specific time (e.g., "5 PM", "3:00") → interpret as {timezone} time
4. For "next week", "next month", etc. → calculate from {current_formatted}
5. All datetime fields MUST use ISO 8601 format: YYYY-MM-DDTHH:MM:SS

EXAMPLES:
- "appointment tomorrow at 5 PM" → datetime: "{tomorrow_iso_date}T17:00:00"
- "meeting today at 3 PM" → datetime: "{current_iso_date}T15:00:00"
- "dinner at 7:30 PM tomorrow" → datetime: "{tomorrow_iso_date}T19:30:00"

Journal Entry: {journal_content}

Output:"""