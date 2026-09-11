// محرك القواعد الموحد لتسجيل الحضور والانصراف (الدوام الأحادي، المزدوج، الثلاثي، والخفارة، والحارس)

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
        // الحارس لديه فترتان (صباحية ومسائية)
        // الفترة الصباحية: التسجيل متاح، الحد الأقصى للحضور 07:10 (بعدها متأخر)
        // الفترة المسائية: الحد الأقصى للحضور 17:10 (5:10 عصراً) بعدها متأخر
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
        // الفترة الأولى: تسجيل من 06:30 إلى قبل 10:20
        if (currentMin >= timeToMinutes("06:30") && currentMin < timeToMinutes("10:20")) {
            if (actionType === 'exit') {
                if (currentMin < timeToMinutes("10:00")) return { allowed: false, message: "عذراً، لا يمكن تسجيل المغادرة قبل الساعة 10:00 صباحاً للفترة الأولى." };
                return { allowed: true, message: "مسموح بالانصراف." };
            }
            let limit = "08:10"; // مدرس
            if (empType === "موظف") limit = "07:10";
            if (empType === "إداري") limit = "07:50";
            const status = (currentMin > timeToMinutes(limit)) ? "متأخر" : "حاضر";
            return { allowed: true, status, message: "تم التسجيل للفترة الأولى (الثامنة - الحادية عشر)." };
        }
        
        // الفترة الثانية: تسجيل من 10:20 إلى قبل 1:30 ظهراً
        if (currentMin >= timeToMinutes("10:20") && currentMin < timeToMinutes("13:30")) {
            if (actionType === 'exit') {
                if (currentMin < timeToMinutes("13:00")) return { allowed: false, message: "عذراً، لا يمكن تسجيل المغادرة قبل الساعة 1:00 ظهراً للفترة الثانية." };
                return { allowed: true, message: "مسموح بالانصراف." };
            }
            let limit = "11:10"; // مدرس
            if (empType === "موظف") limit = "10:35";
            if (empType === "إداري") limit = "10:50";
            const status = (currentMin > timeToMinutes(limit)) ? "متأخر" : "حاضر";
            return { allowed: true, status, message: "تم التسجيل للفترة الثانية (الحادية عشر - الثانية)." };
        }

        // الفترة الثالثة: تسجيل من 1:30 ظهراً فصاعداً
        if (currentMin >= timeToMinutes("13:30")) {
            if (actionType === 'exit') {
                if (currentMin < timeToMinutes("16:00")) return { allowed: false, message: "عذراً، لا يمكن تسجيل المغادرة قبل الساعة 4:00 عصراً للفترة الثالثة." };
                return { allowed: true, message: "مسموح بالانصراف." };
            }
            let limit = "14:10"; // مدرس
            if (empType === "موظف") limit = "13:35";
            if (empType === "إداري") limit = "13:50";
            const status = (currentMin > timeToMinutes(limit)) ? "متأخر" : "حاضر";
            return { allowed: true, status, message: "تم التسجيل للفترة الثالثة (الثانية - الخامسة)." };
        }

        return { allowed: false, message: "عذراً، وقت التسجيل خارج الفترات المعتمدة للدوام الثلاثي." };
    }

    // 3. المدارس الأحادية مع خفارة الظهيرة للموظفين
    if (schoolShiftType === "morning_only") {
        // فحص خفارة الظهيرة للموظف (بين 11:30 و 12:10)
        if (empType === "موظف" && currentMin >= timeToMinutes("11:30") && currentMin <= timeToMinutes("13:00")) {
            if (actionType === 'exit') {
                if (currentMin < timeToMinutes("16:30")) return { allowed: false, message: "عذراً، لا يمكن تسجيل مغادرة الخفارة قبل الساعة 4:30 عصراً." };
                return { allowed: true, message: "مسموح بالانصراف." };
            }
            const status = (currentMin > timeToMinutes("12:10")) ? "متأخر" : "حاضر";
            return { allowed: true, status, message: "تم تسجیل خفارة الظهيرة بنجاح." };
        }

        // الدوام الصباحي الاعتيادي
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

    // 4. المدارس المزدوجة أو المسائية (Dual / Evening)
    if (schoolShiftType === "dual_afternoon" || schoolShiftType === "evening_only") {
        // إذا كان التسجيل في فترة الظهر/المساء
        if (currentMin >= timeToMinutes("11:30")) {
            if (actionType === 'exit') {
                if (currentMin < timeToMinutes("15:45")) return { allowed: false, message: "عذراً، لا يمكن تسجيل المغادرة قبل الساعة 3:45 / 3:50 عصراً." };
                return { allowed: true, message: "مسموح بالانصراف." };
            }
            let limit = "13:10"; // مدرس
            if (empType === "موظف") limit = "12:35";
            if (empType === "إداري") limit = "12:50";
            const status = (currentMin > timeToMinutes(limit)) ? "متأخر" : "حاضر";
            return { allowed: true, status, message: "تم التسجيل لفترة الظهر/المساء." };
        }
    }

    return { allowed: true, status: "حاضر", message: "تم التحقق." };
}
