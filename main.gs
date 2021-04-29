var startTime = new Date(new Date().getFullYear(), 0, 1);
var endTime = new Date(new Date().getFullYear(), 11, 31);
var birthdaysCalendarName = "Birthdays";


function updateBirthdaysCalendar()
{
  var birthdaysCalendar = getOrCreateBirthdaysCalendar();
  
  var contacts = ContactsApp.getContacts();
  for (var i = 0; i < contacts.length; i++)
  {
    var contact = contacts[i];
    var contactName = contact.getFullName();
    var birthdays = contact.getDates().filter(x => x.getLabel().name() == ContactsApp.Field.BIRTHDAY);
    
    if (birthdays.length == 0)
    {
      removeBirthdayForContactIfExist(birthdaysCalendar, contact);
    }
    else if (birthdays.length == 1)
    {
      var birthday = birthdays[0];
      addOrUpdateBirthdayEvent(birthdaysCalendar, contact, birthday);
    }
    else
    {
      Logger.log("Warning: For contact '%s' %s dates were found", contactName, birthdays.length);
    }
  }
  Logger.log("Info: Script has been finished");
}

function getOrCreateBirthdaysCalendar()
{
  var calendars = CalendarApp.getAllCalendars();

  for (var i = 0; i < calendars.length; i++)
  {
    var calendarName = calendars[i].getName();
    if (calendarName == birthdaysCalendarName)
	{
      Logger.log("Info: Existing Birthdays calendar was found");
      return calendars[i];
    }
  }
  Logger.log("Info: Birthdays calendar wasn't found");

  var birthdaysCalendar = CalendarApp.createCalendar(birthdaysCalendarName);
  birthdaysCalendar.setColor("#A32929");
  birthdaysCalendar.setHidden(false);
  createUpdatingTriggerForCalendarIfNotExist();
  Logger.log("Info: Birthdays calendar was created");
  return birthdaysCalendar;
}

function removeBirthdayForContactIfExist(birthdaysCalendar, contact)
{
  var contactId = contact.getId();
  var contactName = contact.getFullName();

  var birthdayEvents = birthdaysCalendar.getEvents(startTime, endTime)
                                        .filter(x => x.getTag("contactId") == contactId.toString());
  birthdayEvents.forEach(x => x.deleteEvent());
  if (birthdayEvents.length > 0)
  {
    Logger.log("Info: Birthday for contact '%s' was removed", contactName)
  }
}

function addOrUpdateBirthdayEvent(birthdaysCalendar, contact, birthday)
{
  var contactId = contact.getId();
  var contactName = contact.getFullName();

  var birthdayEvents = birthdaysCalendar.getEvents(startTime, endTime)
                                        .filter(x => x.getTag("contactId") == contactId.toString());
  
  if (birthdayEvents.length == 0)
  {
    addBirthdayEvent(birthdaysCalendar, contact, birthday)
    Logger.log("Info: Contact '%s': birthday event was added", contactName)
  }
  else if (birthdayEvents.length == 1)
  {
    var wasUpdated = updateBirthdayEvent(birthdayEvents[0], contact, birthday)
    if (wasUpdated)
    {
      Logger.log("Info: Contact '%s': birthday event was updated", contactName)
    }
  }
  else if (birthdayEvents.length > 1)
  {
    Logger.log("Warning: There were %s birthday events found for contact '%s'", birthdayEvents.length, contactName)
  }
}

function addBirthdayEvent(birthdaysCalendar, contact, birthday)
{
  var contactId = contact.getId();
  var contactName = contact.getFullName();
  
  var eventDate = ConvertToDate(birthday);
  
  var eventRule = CalendarApp.newRecurrence().addYearlyRule();
  birthdaysCalendar.createAllDayEventSeries(contactName, eventDate, eventRule)
                   .setGuestsCanInviteOthers(false)
                   .setGuestsCanModify(false)
                   .setGuestsCanSeeGuests(false)
                   .setTag("contactId", contactId.toString())
                   .addEmailReminder(0);
}

function updateBirthdayEvent(birthdayEvent, contact, birthday)
{
  var wasUpdated = false;
  
  var contactName = contact.getFullName();
  var title = birthdayEvent.getTitle();
  if (title != contactName)
  {
    birthdayEvent.setTitle(contactName);
    wasUpdated = true;
  }
  
  var date = ConvertToDate(birthday)
  
  /*
  var eventStartTime = birthdayEvent.getStartTime();
  if (date != eventStartTime)
  {
    birthdayEvent.setAllDayDate(date);
    wasUpdated = true;
  }
  */
  
  return wasUpdated;
}

/**
 * Convert DateFieled to Date
 * @param {DateField} DateFieled.
 * @return {Date} Converted date.
 */
function ConvertToDate(dateField)
{
  var year = dateField.getYear();
  var month = dateField.getMonth().ordinal();
  var day = dateField.getDay();
  var date = new Date(year, month, day)
  return date;
}

function createUpdatingTriggerForCalendarIfNotExist()
{
  var functionName = "updateBirthdaysCalendar";
  var triggers = ScriptApp.getProjectTriggers().filter(x => x.getHandlerFunction() == functionName);
  if (triggers.length > 0)
  {
    Logger.log("Trigger already exist")
    return;
  }
  ScriptApp.newTrigger("updateBirthdaysCalendar")
           .timeBased()
           .atHour(3)
           .everyDays(1)
           .create();
  Logger.log("Trigger was created")
}

