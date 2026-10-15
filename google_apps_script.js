/**
 * ==============================================================================
 * MADHAVBAUG CARDIO SHOTS (HEART CARE) - GOOGLE APPS SCRIPT WEBHOOK CODE
 * ==============================================================================
 * इस कोड को Google Sheets में Setup करने का आसान तरीका:
 * 
 * 1. अपनी नई या पुरानी Google Sheet खोलें जहाँ Leads मंगवाना चाहते हैं।
 * 2. ऊपर मेनू में "Extensions" (एक्सटेंशन) -> "Apps Script" पर क्लिक करें।
 * 3. पहले से लिखे डिफ़ॉल्ट कोड को डिलीट करें, और यह पूरा कोड पेस्ट कर दें।
 * 4. ऊपर "Save" (सेव) आइकॉन पर क्लिक करें।
 * 5. ऊपर दायें कोने में "Deploy" (डिप्लॉय) बटन पर क्लिक करें -> "New deployment" चुनें।
 * 6. 'Select type' के बगल में गियर आइकॉन ⚙️ पर क्लिक करके "Web app" चुनें।
 * 7. Description में लिखें: "Madhavbaug Heart Shots Leads Webhook"
 * 8. "Execute as": "Me" (आपकी अपनी ईमेल आईडी) रखें।
 * 9. "Who has access": "Anyone" (जरूरी: Anyone ही सेलेक्ट करें ताकि फॉर्म सबमिट हो सके)।
 * 10. "Deploy" पर क्लिक करें और Google Permissions को Authorize करें।
 * 11. अब जो "Web App URL" मिलेगा (उदा. https://script.google.com/macros/s/.../exec)
 *     उसे कॉपी करें और अपने प्रोजेक्ट की `assets/js/main.js` फ़ाइल में 
 *     `GOOGLE_SHEETS_WEBHOOK_URL` की जगह पेस्ट कर दें!
 * ==============================================================================
 */

function doPost(e) {
  var lock = LockService.getScriptLock();
  // 10 सेकंड का लॉक ताकि एक साथ कई सबमिशन आने पर डेटा मिक्स न हो
  lock.tryLock(10000);

  try {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    var rawData = e.postData.contents;
    var data;

    try {
      data = JSON.parse(rawData);
    } catch (parseErr) {
      data = e.parameter;
    }

    // अगर शीट बिल्कुल खाली है, तो प्रीमियम हेडर रो खुद बना दें
    if (sheet.getLastRow() === 0) {
      sheet.appendRow([
        "Timestamp (तारीख व समय)",
        "Order ID (ऑर्डर नंबर)",
        "Name (ग्राहक का नाम)",
        "Contact Number (मोबाइल नंबर)",
        "Address (डिलीवरी पता)",
        "City (शहर)",
        "State (राज्य)",
        "Package (चुना गया पैक)",
        "Price (कीमत)",
        "Payment Mode (भुगतान तरीका)",
        "Landing Page URL"
      ]);
      
      // Madhavbaug Heart Burgundy (#7E1826) थीम वाली हेडिंग स्टाइलिंग
      var headerRange = sheet.getRange(1, 1, 1, 11);
      headerRange.setFontWeight("bold");
      headerRange.setBackground("#7E1826");
      headerRange.setFontColor("#FFFFFF");
      headerRange.setHorizontalAlignment("center");
      sheet.setFrozenRows(1);
    }

    // 10 अंकों का शुद्ध मोबाइल नंबर निकालें
    var contactNumber = String(data.contact || "").replace(/\D/g, "").slice(-10);

    // 24-घंटे डुप्लीकेट नंबर चेक (एक ही ग्राहक बार-बार सबमिट न कर सके)
    if (contactNumber && contactNumber.length === 10) {
      var lastRow = sheet.getLastRow();
      if (lastRow > 1) {
        var values = sheet.getRange(2, 1, lastRow - 1, 4).getValues(); // Col 1: Timestamp, Col 2: OrderID, Col 3: Name, Col 4: Contact
        var now = new Date();
        var oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

        for (var i = values.length - 1; i >= 0; i--) {
          var rowContact = String(values[i][3] || "").replace(/\D/g, "").slice(-10);
          if (rowContact === contactNumber) {
            var rowTime = new Date(values[i][0]);
            // यदि पिछले 24 घंटे में सबमिट हुआ है तो ऑलरेडी सबमिटेड रिस्पांस भेजें
            if (isNaN(rowTime.getTime()) || rowTime >= oneDayAgo) {
              return ContentService
                .createTextOutput(JSON.stringify({
                  status: "already_submitted",
                  message: "Already submitted form. Wait for 24hr, our cardiac expert will call you shortly."
                }))
                .setMimeType(ContentService.MimeType.JSON);
            }
          }
        }
      }
    }

    // नई लीड को गूगल शीट में दर्ज करें
    var orderId = data.orderId || ("MDB-HRT-" + Math.floor(10000 + Math.random() * 90000));
    var timestamp = data.timestamp || new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" });

    sheet.appendRow([
      timestamp,
      orderId,
      data.name || "Customer",
      data.contact ? "'" + data.contact : "", // अपोस्ट्रॉफी (') लगाने से एक्सेल/गूगल शीट नंबर फॉर्मेट खराब नहीं करता
      data.address || "-",
      data.city || "-",
      data.state || "-",
      data.package || "Cardio Shots",
      data.price || "-",
      data.paymentMode || "Cash On Delivery (COD)",
      data.pageUrl || ""
    ]);

    return ContentService
      .createTextOutput(JSON.stringify({
        status: "success",
        message: "Heart Care Lead saved successfully",
        orderId: orderId
      }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({
        status: "error",
        message: error.toString()
      }))
      .setMimeType(ContentService.MimeType.JSON);
  } finally {
    lock.releaseLock();
  }
}

// जब कोई ब्राउज़र में इस URL को खोलेगा तो यह स्टेटस दिखाएगा
function doGet(e) {
  return ContentService.createTextOutput("✅ Madhavbaug Cardio Shots (Heart Care) Webhook is Live and Active!");
}
