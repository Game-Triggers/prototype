import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { IUser } from '@schemas/user.schema';

export interface UserLevelData {
  currentLevel: number;
  totalXP: number;
  totalRP: number;
  canAdvance: boolean;
}

@Injectable()
export class LevelService {
  constructor(@InjectModel('User') private userModel: Model<IUser>) {}

  async getUserLevelData(userId: string): Promise<UserLevelData> {
    const user = await this.userModel.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const totalXP = user.xp?.total || 0;
    const totalRP = user.rp?.total || 0;

    // Simplified level calculation for now
    let currentLevel = 1;
    const combinedPoints = totalXP + totalRP;
<<<<<<< HEAD

=======
>>>>>>> adcedc4 (Resolve all merge conflicts - keep energy pack system implementation)
    if (combinedPoints >= 5500) currentLevel = 10;
    else if (combinedPoints >= 4000) currentLevel = 9;
    else if (combinedPoints >= 3000) currentLevel = 8;
    else if (combinedPoints >= 2200) currentLevel = 7;
    else if (combinedPoints >= 1500) currentLevel = 6;
    else if (combinedPoints >= 1000) currentLevel = 5;
    else if (combinedPoints >= 600) currentLevel = 4;
    else if (combinedPoints >= 300) currentLevel = 3;
    else if (combinedPoints >= 150) currentLevel = 2;

    return {
      currentLevel,
      totalXP,
      totalRP,
      canAdvance: currentLevel < 10,
    };
  }

  async checkForLevelUp(userId: string): Promise<{
    leveledUp: boolean;
    oldLevel: number;
    newLevel: number;
  }> {
    const user = await this.userModel.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Calculate levels from stored XP/RP to determine if there was a level change
    const oldTotalXP = user.xp?.total || 0;
    const oldTotalRP = user.rp?.total || 0;
    const oldCombinedPoints = oldTotalXP + oldTotalRP;

    // Calculate old level from previous points
    let oldLevel = 1;
    if (oldCombinedPoints >= 5500) oldLevel = 10;
    else if (oldCombinedPoints >= 4000) oldLevel = 9;
    else if (oldCombinedPoints >= 3000) oldLevel = 8;
    else if (oldCombinedPoints >= 2200) oldLevel = 7;
    else if (oldCombinedPoints >= 1500) oldLevel = 6;
    else if (oldCombinedPoints >= 1000) oldLevel = 5;
    else if (oldCombinedPoints >= 600) oldLevel = 4;
    else if (oldCombinedPoints >= 300) oldLevel = 3;
    else if (oldCombinedPoints >= 150) oldLevel = 2;

    const levelData = await this.getUserLevelData(userId);
    const newLevel = levelData.currentLevel;

    return {
      leveledUp: newLevel > oldLevel,
      oldLevel,
      newLevel,
    };
  }
}
