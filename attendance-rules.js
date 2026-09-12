// محرك القواعد الموحد لتسجيل الحضور والانصراف (بدون قيود وقت بداية التسجيل المبكر)

// دالة لحساب الدقائق من نص الوقت (مثال "08:10" إلى دقائق)
function timeToMinutes(timeStr) {
    if (!timeStr) return 0;
    const [h, m] = timeStr.split(':').map(Number);
    return h * 60 + m;
}

// الدالة الرئيسية لفحص حالة الحضور والأوقات لكل الفئات وأنواع المدارس
function evaluateAttendanceRules(schoolShiftType, empType, actionType, currentTimeStr) {
    const currentMin = timeToMinutes(currentTimeStr);
    
    // 1. قاعدة الحارس (ثابتة لجميع المدارس ولا يوجد لها وقت مغادرة محدد)
    if (empType === "حارس") {
        if (actionType === 'exit') {
            return { allowed: true, status: "حاضر", message: "مسموح بالانصراف للحارس في أي وقت." };
        }
        const limitMorning = timeToMinutes("07:10");
        const limitEvening = timeToMinutes("17:10");
        
        let status = "حاضر";
        if (currentMin > limitMorning && currentMin < 12 * 60) {
            status = "متأخر";
        } else if (currentMin > limitEvening) {
            status = "متأخر";
        }
        return { allowed: true, status, message: "تم احتساب حضور الحارس بنجاح." };
    }

    // 2. المدارس ذات الدوام الثلاثي (triple_shift)
    if (schoolShiftType === "triple_shift") {
        // تحديد الفترة بناءً على الوقت الحالي (الصباحية، الثانية، الثالثة)
        // الفترة الأولى (حتى قبل 10:20)
        if (currentMin < timeToMinutes("10:20")) {
            if (actionType === 'exit') {
                if (currentMin < timeToMinutes("10:00")) return { allowed: false, message: "عذراً، لا يمكن تسجيل المغادرة قبل الساعة 10:00 صباحاً للفترة الأولى." };
                return { allowed: true, message: "مسموح بالانصراف." };
            }
            let limit = "08:10"; // مدرس
            if (empType === "موظف") limit = "07:10";
            if (empType === "إداري") limit = "07:50";
            const status = (currentMin > timeToMinutes(limit)) ? "متأخر" : "حاضر";
            return { allowed: true, status, message: "تم التسجيل للفترة الأولى." };
        }
        
        // الفترة الثانية (من 10:20 وحتى قبل 1:30 ظهراً)
        if (currentMin >= timeToMinutes("10:20") && currentMin < timeToMinutes("13:30")) {
            if (actionType === 'exit') {
                if (currentMin < timeToMinutes("13:00")) return { allowed: false, message: "عذراً، لا يمكن تسجيل المغادرة قبل الساعة 1:00 ظهراً للفترة الثانية." };
                return { allowed: true, message: "مسموح بالانصراف." };
            }
            let limit = "11:10"; // مدرس
            if (empType === "موظف") limit = "10:35";
            if (empType === "إداري") limit = "10:50";
            const status = (currentMin > timeToMinutes(limit)) ? "متأخر" : "حاضر";
            return { allowed: true, status, message: "تم التسجيل للفترة الثانية." };
        }

        // الفترة الثالثة (من 1:30 ظهراً فصاعداً)
        if (currentMin >= timeToMinutes("13:30")) {
            if (actionType === 'exit') {
                if (currentMin < timeToMinutes("16:00")) return { allowed: false, message: "عذراً، لا يمكن تسجيل المغادرة قبل الساعة 4:00 عصراً للفترة الثالثة." };
                return { allowed: true, message: "مسموح بالانصراف." };
            }
            let limit = "14:10"; // مدرس
            if (empType === "موظف") limit = "13:35";
            if (empType === "إداري") limit = "13:50";
            const status = (currentMin > timeToMinutes(limit)) ? "متأخر" : "حاضر";
            return { allowed: true, status, message: "تم التسجيل للفترة الثالثة." };
        }
    }

    // 3. المدارس الأحادية (morning_only) مع خفارة الظهيرة للموظفين
    if (schoolShiftType === "morning_only") {
        // فحص خفارة الظهيرة للموظف (بين 11:30 و 13:00)
        if (empType === "موظف" && currentMin >= timeToMinutes("11:30") && currentMin <= timeToMinutes("13:00")) {
            if (actionType === 'exit') {
                if (currentMin < timeToMinutes("16:30")) return { allowed: false, message: "عذراً، لا يمكن تسجيل مغادرة الخفارة قبل الساعة 4:30 عصراً." };
                return { allowed: true, message: "مسموح بالانصراف." };
            }
            const status = (currentMin > timeToMinutes("12:10")) ? "متأخر" : "حاضر";
            return { allowed: true, status, message: "تم تسجيل خفارة الظهيرة بنجاح." };
        }

        // الدوام الصباحي الاعتيادي للأحادية
        if (actionType === 'exit') {
            if (currentMin < timeToMinutes("11:00")) return { allowed: false, message: "عذراً، لا يمكن تسجيل الانصراف قبل الساعة 11:00 صباحاً." };
            return { allowed: true, message: "مسموح بالانصراف." };
        }

        let limit = "08:10"; // مدرس
        if (empType === "موظف") limit = "07:10";
        if (empType === "إداري") limit = "07:50";
        const status = (currentMin > timeToMinutes(limit)) ? "متأخر" : "حاضر";
        return { allowed: true, status, message: "تم التسجيل للدوام الصباحي الاعتيادي." };
    }

    // 4. المدارس المزدوجة (dual_afternoon) - فترتين (صباحية أو ظهر)
    if (schoolShiftType === "dual_afternoon") {
        // الفترة الصباحية للمدرسة المزدوجة (أقل من 11:30)
        if (currentMin < timeToMinutes("11:30")) {
            if (actionType === 'exit') {
                if (currentMin < timeToMinutes("11:00")) return { allowed: false, message: "عذراً، لا يمكن تسجيل الانصراف قبل الساعة 11:00 صباحاً." };
                return { allowed: true, message: "مسموح بالانصراف." };
            }
            let limit = "08:10"; // مدرس
            if (empType === "موظف") limit = "07:10";
            if (empType === "إداري") limit = "07:50";
            const status = (currentMin > timeToMinutes(limit)) ? "متأخر" : "حاضر";
            return { allowed: true, status, message: "تم التسجيل للفترة الصباحية للدوام المزدوج." };
        }

        // الفترة الثانية (الظهر) للمدرسة المزدوجة (من 11:30 فصاعداً)
        if (currentMin >= timeToMinutes("11:30")) {
            if (actionType === 'exit') {
                if (currentMin < timeToMinutes("15:40")) return { allowed: false, message: "عذراً، لا يمكن تسجيل المغادرة قبل الساعة 3:40 عصراً." };
                return { allowed: true, message: "مسموح بالانصراف." };
            }
            let limit = "13:10"; // مدرس
            if (empType === "موظف") limit = "12:30";
            if (empType === "إداري") limit = "12:50";
            const status = (currentMin > timeToMinutes(limit)) ? "متأخر" : "حاضر";
            return { allowed: true, status, message: "تم التسجيل لفترة الظهر للدوام المزدوج." };
        }
    }

    // 5. المدارس المسائية البحتة (evening_only) - مستقلة تماماً
    if (schoolShiftType === "evening_only") {
        if (actionType === 'exit') {
            if (currentMin < timeToMinutes("15:40")) return { allowed: false, message: "عذراً، لا يمكن تسجيل المغادرة قبل الساعة 3:40 عصراً." };
            return { allowed: true, message: "مسموح بالانصراف." };
        }
        
        let limit = "14:10"; // مدرس (2:10)
        if (empType === "موظف") limit = "13:35"; // (1:35)
        if (empType === "إداري") limit = "13:50"; // (1:50)
        
        const status = (currentMin > timeToMinutes(limit)) ? "متأخر" : "حاضر";
        return { allowed: true, status, message: "تم التسجيل للدوام المسائي البحت." };
    }

    return { allowed: true, status: "حاضر", message: "تم التحقق." };
}
