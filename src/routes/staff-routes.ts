import { Router } from "express";
import { prisma } from "../lib/prisma";

const router = Router();

// Get department staff (aggregates direct department staff + all laboratory staff)
router.get("/departments/:id/staff", async (req, res) => {
    try {
        const { id } = req.params;

        // Get direct department staff
        const departmentStaff = await prisma.departmentStaff.findMany({
            where: { department_id: id },
            include: {
                staff: true,
            },
        });

        // Get all laboratories for this department
        const laboratories = await (prisma as any).laboratory.findMany({
            where: { department_id: id },
            include: {
                laboratoryStaffs: {
                    include: {
                        staff: true,
                    },
                },
            },
        });

        // Create a map to track unique staff and their affiliations
        const staffMap = new Map();

        // Add direct department staff
        departmentStaff.forEach((ds) => {
            const staffId = ds.staff.id;
            if (!staffMap.has(staffId)) {
                staffMap.set(staffId, {
                    ...ds.staff,
                    laboratories: [],
                    isDepartmentStaff: true,
                });
            }
        });

        // Add laboratory staff
        laboratories.forEach((lab: any) => {
            lab.laboratoryStaffs.forEach((labStaff: any) => {
                const staffId = labStaff.staff.id;

                if (!staffMap.has(staffId)) {
                    staffMap.set(staffId, {
                        ...labStaff.staff,
                        laboratories: [],
                        isDepartmentStaff: false,
                    });
                }

                // Add laboratory affiliation
                staffMap.get(staffId).laboratories.push({
                    id: lab.id,
                    name: lab.name,
                    position: labStaff.position,
                });
            });
        });

        const staff = Array.from(staffMap.values());

        res.json({ staff });
    } catch (error: any) {
        console.error("Error fetching department staff:", error);
        res.status(500).json({ message: "Failed to fetch department staff" });
    }
});

// Get laboratory staff
router.get("/laboratories/:id/staff", async (req, res) => {
    try {
        const { id } = req.params;

        const laboratoryStaff = await (prisma as any).laboratoryStaff.findMany({
            where: { laboratory_id: id },
            include: {
                staff: true,
            },
        });

        const staff = laboratoryStaff.map((ls: any) => ({
            ...ls.staff,
            labPosition: ls.position,
        }));

        res.json({ staff });
    } catch (error: any) {
        console.error("Error fetching laboratory staff:", error);
        res.status(500).json({ message: "Failed to fetch laboratory staff" });
    }
});

export default router;
