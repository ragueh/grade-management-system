const Teacher = require('../models/Teacher');
const Class = require('../models/Class');
const Assessment = require('../models/Assessment');
const Mark = require('../models/Mark');
const Student = require('../models/Student');
const { updateStudentCalculation, recalculateClassGrades } = require('../utils/calculations');
const { logAudit, formatSuccessResponse, formatErrorResponse } = require('../utils/helpers');
const { MESSAGES } = require('../config/constants');

/**
 * Get teacher dashboard data
 * GET /api/teacher/dashboard
 */
const getDashboard = async (req, res) => {
  try {
    const userId = req.user.id;

    // Get teacher record
    const teacher = await Teacher.findByUserId(userId);
    if (!teacher) {
      return res.status(404).json(formatErrorResponse('Teacher record not found'));
    }

    // Get statistics
    const stats = await Teacher.getStatistics(teacher.id);

    // Get recent classes
    const classes = await Class.findByTeacherId(teacher.id);

    res.status(200).json(formatSuccessResponse('Dashboard data retrieved', {
      teacher,
      statistics: stats,
      classes,
    }));
  } catch (error) {
    console.error('Get dashboard error:', error);
    res.status(500).json(formatErrorResponse(MESSAGES.ERROR.INTERNAL_SERVER));
  }
};

/**
 * Get teacher's classes
 * GET /api/teacher/classes
 */
const getClasses = async (req, res) => {
  try {
    const userId = req.user.id;

    const teacher = await Teacher.findByUserId(userId);
    if (!teacher) {
      return res.status(404).json(formatErrorResponse('Teacher record not found'));
    }

    const classes = await Class.findByTeacherId(teacher.id);

    res.status(200).json(formatSuccessResponse('Classes retrieved', classes));
  } catch (error) {
    console.error('Get classes error:', error);
    res.status(500).json(formatErrorResponse(MESSAGES.ERROR.INTERNAL_SERVER));
  }
};

/**
 * Create a new class
 * POST /api/teacher/classes
 */
const createClass = async (req, res) => {
  try {
    const userId = req.user.id;
    const { class_name, subject, academic_year } = req.body;

    const teacher = await Teacher.findByUserId(userId);
    if (!teacher) {
      return res.status(404).json(formatErrorResponse('Teacher record not found'));
    }

    const newClass = await Class.create({
      teacher_id: teacher.id,
      class_name,
      subject,
      academic_year,
    });

    await logAudit({
      action: 'CLASS_CREATE',
      userId,
      affectedTable: 'classes',
      affectedRecordId: newClass.id,
      newValue: newClass,
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });

    res.status(201).json(formatSuccessResponse(MESSAGES.SUCCESS.CREATED, newClass));
  } catch (error) {
    console.error('Create class error:', error);
    res.status(500).json(formatErrorResponse(error.message || MESSAGES.ERROR.INTERNAL_SERVER));
  }
};

/**
 * Get class details with students
 * GET /api/teacher/classes/:id
 */
const getClassDetails = async (req, res) => {
  try {
    const classId = req.params.id;

    const classData = await Class.findById(classId);
    if (!classData) {
      return res.status(404).json(formatErrorResponse('Class not found'));
    }

    const students = await Class.getStudentsWithGrades(classId);
    const statistics = await Class.getStatistics(classId);

    res.status(200).json(formatSuccessResponse('Class details retrieved', {
      class: classData,
      students,
      statistics,
    }));
  } catch (error) {
    console.error('Get class details error:', error);
    res.status(500).json(formatErrorResponse(MESSAGES.ERROR.INTERNAL_SERVER));
  }
};

/**
 * Update class
 * PUT /api/teacher/classes/:id
 */
const updateClass = async (req, res) => {
  try {
    const classId = req.params.id;
    const updates = req.body;

    const updatedClass = await Class.update(classId, updates);

    await logAudit({
      action: 'CLASS_UPDATE',
      userId: req.user.id,
      affectedTable: 'classes',
      affectedRecordId: classId,
      newValue: updates,
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });

    res.status(200).json(formatSuccessResponse(MESSAGES.SUCCESS.UPDATED, updatedClass));
  } catch (error) {
    console.error('Update class error:', error);
    res.status(500).json(formatErrorResponse(MESSAGES.ERROR.INTERNAL_SERVER));
  }
};

/**
 * Get assessments for a class
 * GET /api/teacher/classes/:classId/assessments
 */
const getAssessments = async (req, res) => {
  try {
    const classId = req.params.classId;

    const assessments = await Assessment.findByClassId(classId);
    const weightValidation = await Assessment.validateWeights(classId);

    res.status(200).json(formatSuccessResponse('Assessments retrieved', {
      assessments,
      validation: weightValidation,
    }));
  } catch (error) {
    console.error('Get assessments error:', error);
    res.status(500).json(formatErrorResponse(MESSAGES.ERROR.INTERNAL_SERVER));
  }
};

/**
 * Create assessment type
 * POST /api/teacher/classes/:classId/assessments
 */
const createAssessment = async (req, res) => {
  try {
    const classId = req.params.classId;
    const userId = req.user.id;
    const { type_name, weight, display_order } = req.body;

    const teacher = await Teacher.findByUserId(userId);

    const newAssessment = await Assessment.create({
      class_id: classId,
      type_name,
      weight,
      display_order,
    });

    await logAudit({
      action: 'ASSESSMENT_CREATE',
      userId,
      affectedTable: 'assessment_types',
      affectedRecordId: newAssessment.id,
      newValue: newAssessment,
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });

    res.status(201).json(formatSuccessResponse(MESSAGES.SUCCESS.CREATED, newAssessment));
  } catch (error) {
    console.error('Create assessment error:', error);
    res.status(500).json(formatErrorResponse(error.message || MESSAGES.ERROR.INTERNAL_SERVER));
  }
};

/**
 * Update assessment type
 * PUT /api/teacher/assessments/:id
 */
const updateAssessment = async (req, res) => {
  try {
    const assessmentId = req.params.id;
    const userId = req.user.id;
    const updates = req.body;

    const teacher = await Teacher.findByUserId(userId);

    const updatedAssessment = await Assessment.update(assessmentId, updates, teacher.id);

    await logAudit({
      action: 'ASSESSMENT_UPDATE',
      userId,
      affectedTable: 'assessment_types',
      affectedRecordId: assessmentId,
      newValue: updates,
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });

    res.status(200).json(formatSuccessResponse(MESSAGES.SUCCESS.UPDATED, updatedAssessment));
  } catch (error) {
    console.error('Update assessment error:', error);
    res.status(500).json(formatErrorResponse(error.message || MESSAGES.ERROR.INTERNAL_SERVER));
  }
};

/**
 * Get marks for a class
 * GET /api/teacher/classes/:classId/marks
 */
const getClassMarks = async (req, res) => {
  try {
    const classId = req.params.classId;

    const marks = await Mark.findByClassId(classId);

    res.status(200).json(formatSuccessResponse('Marks retrieved', marks));
  } catch (error) {
    console.error('Get class marks error:', error);
    res.status(500).json(formatErrorResponse(MESSAGES.ERROR.INTERNAL_SERVER));
  }
};

/**
 * Enter a mark for a student
 * POST /api/teacher/marks
 */
const createMark = async (req, res) => {
  try {
    const userId = req.user.id;
    const { student_id, assessment_id, assessment_date, score, teacher_comment, status } = req.body;

    const teacher = await Teacher.findByUserId(userId);
    if (!teacher) {
      return res.status(404).json(formatErrorResponse('Teacher record not found'));
    }

    // Check for duplicate
    const duplicate = await Mark.findDuplicate(student_id, assessment_id, assessment_date);
    if (duplicate) {
      return res.status(409).json(formatErrorResponse('Mark already exists for this student and assessment on this date'));
    }

    const newMark = await Mark.create({
      student_id,
      assessment_id,
      assessment_date,
      score,
      teacher_comment,
      entered_by_teacher_id: teacher.id,
      status,
    });

    // Update student's calculation
    const student = await Student.findById(student_id);
    if (student) {
      await updateStudentCalculation(student_id, student.class_id);
    }

    await logAudit({
      action: 'MARK_CREATE',
      userId,
      affectedTable: 'marks',
      affectedRecordId: newMark.id,
      newValue: newMark,
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });

    res.status(201).json(formatSuccessResponse(MESSAGES.SUCCESS.MARK_SAVED, newMark));
  } catch (error) {
    console.error('Create mark error:', error);
    res.status(500).json(formatErrorResponse(error.message || MESSAGES.ERROR.INTERNAL_SERVER));
  }
};

/**
 * Update a mark
 * PUT /api/teacher/marks/:id
 */
const updateMark = async (req, res) => {
  try {
    const markId = req.params.id;
    const updates = req.body;

    const updatedMark = await Mark.update(markId, updates);

    // Update student's calculation
    const student = await Student.findById(updatedMark.student_id);
    if (student) {
      await updateStudentCalculation(updatedMark.student_id, student.class_id);
    }

    await logAudit({
      action: 'MARK_UPDATE',
      userId: req.user.id,
      affectedTable: 'marks',
      affectedRecordId: markId,
      newValue: updates,
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });

    res.status(200).json(formatSuccessResponse(MESSAGES.SUCCESS.UPDATED, updatedMark));
  } catch (error) {
    console.error('Update mark error:', error);
    res.status(500).json(formatErrorResponse(error.message || MESSAGES.ERROR.INTERNAL_SERVER));
  }
};

/**
 * Delete a mark
 * DELETE /api/teacher/marks/:id
 */
const deleteMark = async (req, res) => {
  try {
    const markId = req.params.id;

    // Get mark details before deleting
    const mark = await Mark.findById(markId);
    if (!mark) {
      return res.status(404).json(formatErrorResponse('Mark not found'));
    }

    await Mark.delete(markId);

    // Update student's calculation
    await updateStudentCalculation(mark.student_id, mark.class_id);

    await logAudit({
      action: 'MARK_DELETE',
      userId: req.user.id,
      affectedTable: 'marks',
      affectedRecordId: markId,
      oldValue: mark,
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });

    res.status(200).json(formatSuccessResponse(MESSAGES.SUCCESS.DELETED));
  } catch (error) {
    console.error('Delete mark error:', error);
    res.status(500).json(formatErrorResponse(MESSAGES.ERROR.INTERNAL_SERVER));
  }
};

/**
 * Recalculate all grades for a class
 * POST /api/teacher/classes/:classId/recalculate
 */
const recalculateGrades = async (req, res) => {
  try {
    const classId = req.params.classId;

    const results = await recalculateClassGrades(classId);

    res.status(200).json(formatSuccessResponse('Grades recalculated', results));
  } catch (error) {
    console.error('Recalculate grades error:', error);
    res.status(500).json(formatErrorResponse(MESSAGES.ERROR.INTERNAL_SERVER));
  }
};

module.exports = {
  getDashboard,
  getClasses,
  createClass,
  getClassDetails,
  updateClass,
  getAssessments,
  createAssessment,
  updateAssessment,
  getClassMarks,
  createMark,
  updateMark,
  deleteMark,
  recalculateGrades,
};
