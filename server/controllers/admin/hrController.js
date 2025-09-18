const bcrypt = require('bcryptjs');
const User = require('../../models/User');

// @desc    Get all HR users for the admin's company
// @access  Private (Admin only)
const getAllHRUsers = async (req, res) => {
  try {
    const hrUsers = await User.find({ 
      role: 'hr',
      companyId: req.user.companyId 
    })
    .select('-password')
    .sort({ createdAt: -1 });

    const formattedHRs = hrUsers.map(hr => ({
      id: hr._id,
      name: `${hr.firstName} ${hr.lastName}`.trim() || 'N/A',
      email: hr.email,
      department: hr.department || 'N/A',
      dateJoined: hr.joiningDate ? hr.joiningDate.toISOString().split('T')[0] : new Date(hr.createdAt).toISOString().split('T')[0],
      status: hr.isActive !== false ? 'active' : 'inactive',
      jobTitle: hr.jobTitle || 'HR',
      location: hr.workLocation || hr.location || 'N/A',
      jobsPosted: 0, // TODO: Calculate actual jobs posted by this HR
      candidatesHired: 0 // TODO: Calculate actual candidates hired by this HR
    }));

    res.json(formattedHRs);
  } catch (error) {
    console.error('Error fetching HR users:', error);
    res.status(500).json({ 
      error: 'Failed to fetch HR users',
      details: error.message 
    });
  }
};

// @desc    Create new HR user
// @access  Private (Admin only)
const createHRUser = async (req, res) => {
  try {
    const { firstName, lastName, email, department, password } = req.body;

    // Validate required fields
    if (!firstName || !lastName || !email || !department || !password) {
      return res.status(400).json({ 
        error: 'All fields are required: firstName, lastName, email, department, password' 
      });
    }

    // Check if email already exists
    const existingUser = await User.findOne({ 
      email: email.toLowerCase().trim() 
    });

    if (existingUser) {
      return res.status(400).json({ 
        error: 'A user with this email already exists' 
      });
    }

    // Hash password
    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create new HR user
    const newHRUser = new User({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: email.toLowerCase().trim(),
      password: hashedPassword,
      role: 'hr',
      department: department.trim(),
      company: req.user.company || req.user.companyId,
      joiningDate: new Date(),
      isActive: true,
      jobTitle: 'HR',
      createdBy: req.user._id
    });

    const savedUser = await newHRUser.save();

    // Return the formatted HR data (without password)
    const responseData = {
      id: savedUser._id,
      name: `${savedUser.firstName} ${savedUser.lastName}`.trim(),
      email: savedUser.email,
      department: savedUser.department,
      dateJoined: savedUser.joiningDate.toISOString().split('T')[0],
      status: 'active',
      jobTitle: savedUser.jobTitle,
      location: savedUser.workLocation || savedUser.location || 'N/A',
      jobsPosted: 0,
      candidatesHired: 0
    };

    res.status(201).json({
      message: 'HR user created successfully',
      hr: responseData
    });

  } catch (error) {
    console.error('Error creating HR user:', error);
    
    // Handle validation errors
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ 
        error: 'Validation failed', 
        details: validationErrors 
      });
    }

    // Handle duplicate key errors
    if (error.code === 11000) {
      return res.status(400).json({ 
        error: 'A user with this email already exists' 
      });
    }

    res.status(500).json({ 
      error: 'Failed to create HR user',
      details: error.message 
    });
  }
};

// @desc    Update HR user
// @access  Private (Admin only)
const updateHRUser = async (req, res) => {
  try {
    const { hrId } = req.params;
    const { firstName, lastName, email, department, password } = req.body;

    // Validate required fields (password is optional for updates)
    if (!firstName || !lastName || !email || !department) {
      return res.status(400).json({ 
        error: 'First name, last name, email, and department are required' 
      });
    }

    // Find the HR user
    const hrUser = await User.findOne({ 
      _id: hrId, 
      role: 'hr',
      companyId: req.user.companyId 
    });

    if (!hrUser) {
      return res.status(404).json({ 
        error: 'HR user not found' 
      });
    }

    // Check if email is being changed and if new email already exists
    if (email.toLowerCase().trim() !== hrUser.email) {
      const existingUser = await User.findOne({ 
        email: email.toLowerCase().trim(),
        _id: { $ne: hrId }
      });

      if (existingUser) {
        return res.status(400).json({ 
          error: 'A user with this email already exists' 
        });
      }
    }

    // Prepare update data
    const updateData = {
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: email.toLowerCase().trim(),
      department: department.trim(),
      updatedAt: new Date(),
      updatedBy: req.user._id
    };

    // Hash new password if provided
    if (password && password.trim()) {
      const salt = await bcrypt.genSalt(12);
      updateData.password = await bcrypt.hash(password.trim(), salt);
    }

    // Update the user
    const updatedUser = await User.findByIdAndUpdate(
      hrId,
      updateData,
      { new: true, runValidators: true }
    ).select('-password');

    if (!updatedUser) {
      return res.status(404).json({ 
        error: 'HR user not found' 
      });
    }

    // Return the formatted HR data
    const responseData = {
      id: updatedUser._id,
      name: `${updatedUser.firstName} ${updatedUser.lastName}`.trim(),
      email: updatedUser.email,
      department: updatedUser.department,
      dateJoined: updatedUser.joiningDate ? updatedUser.joiningDate.toISOString().split('T')[0] : new Date(updatedUser.createdAt).toISOString().split('T')[0],
      status: updatedUser.isActive !== false ? 'active' : 'inactive',
      jobTitle: updatedUser.jobTitle || 'HR',
      location: updatedUser.workLocation || updatedUser.location || 'N/A',
      jobsPosted: 0, // TODO: Calculate actual jobs posted
      candidatesHired: 0 // TODO: Calculate actual candidates hired
    };

    res.json({
      message: 'HR user updated successfully',
      hr: responseData
    });

  } catch (error) {
    console.error('Error updating HR user:', error);
    
    // Handle validation errors
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ 
        error: 'Validation failed', 
        details: validationErrors 
      });
    }

    // Handle duplicate key errors
    if (error.code === 11000) {
      return res.status(400).json({ 
        error: 'A user with this email already exists' 
      });
    }

    res.status(500).json({ 
      error: 'Failed to update HR user',
      details: error.message 
    });
  }
};

// @desc    Delete HR user
// @access  Private (Admin only)
const deleteHRUser = async (req, res) => {
  try {
    const { hrId } = req.params;

    // Find and delete the HR user
    const deletedUser = await User.findOneAndDelete({ 
      _id: hrId, 
      role: 'hr',
      companyId: req.user.companyId 
    });

    if (!deletedUser) {
      return res.status(404).json({ 
        error: 'HR user not found' 
      });
    }

    res.json({
      message: 'HR user deleted successfully',
      deletedHR: {
        id: deletedUser._id,
        name: `${deletedUser.firstName} ${deletedUser.lastName}`.trim(),
        email: deletedUser.email
      }
    });

  } catch (error) {
    console.error('Error deleting HR user:', error);
    res.status(500).json({ 
      error: 'Failed to delete HR user',
      details: error.message 
    });
  }
};

// @desc    Toggle HR user status (active/inactive)
// @access  Private (Admin only)
const toggleHRUserStatus = async (req, res) => {
  try {
    const { hrId } = req.params;

    // Find the HR user
    const hrUser = await User.findOne({ 
      _id: hrId, 
      role: 'hr',
      companyId: req.user.companyId 
    });

    if (!hrUser) {
      return res.status(404).json({ 
        error: 'HR user not found' 
      });
    }

    // Toggle the status
    const newStatus = hrUser.isActive === false ? true : false;
    
    const updatedUser = await User.findByIdAndUpdate(
      hrId,
      { 
        isActive: newStatus,
        updatedAt: new Date(),
        updatedBy: req.user._id
      },
      { new: true }
    ).select('-password');

    const responseData = {
      id: updatedUser._id,
      name: `${updatedUser.firstName} ${updatedUser.lastName}`.trim(),
      email: updatedUser.email,
      phone: updatedUser.phone,
      department: updatedUser.department,
      dateJoined: updatedUser.joiningDate ? updatedUser.joiningDate.toISOString().split('T')[0] : new Date(updatedUser.createdAt).toISOString().split('T')[0],
      status: updatedUser.isActive ? 'active' : 'inactive',
      jobTitle: updatedUser.jobTitle || 'HR',
      location: updatedUser.workLocation || updatedUser.location || 'N/A'
    };

    res.json({
      message: `HR user ${newStatus ? 'activated' : 'deactivated'} successfully`,
      hr: responseData
    });

  } catch (error) {
    console.error('Error toggling HR user status:', error);
    res.status(500).json({ 
      error: 'Failed to toggle HR user status',
      details: error.message 
    });
  }
};

module.exports = {
  getAllHRUsers,
  createHRUser,
  updateHRUser,
  deleteHRUser,
  toggleHRUserStatus
};