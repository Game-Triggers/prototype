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

    const currentStoredLevel = user.xp?.level || 1;
    const levelData = await this.getUserLevelData(userId);
    const actualLevel = levelData.currentLevel;

    if (actualLevel > currentStoredLevel) {
      // Update the stored level
      if (user.xp) {
        user.xp.level = actualLevel;
        await user.save();
      }

      return {
        leveledUp: true,
        oldLevel: currentStoredLevel,
        newLevel: actualLevel,
      };
    }

    return {
      leveledUp: false,
      oldLevel: currentStoredLevel,
      newLevel: actualLevel,
    };
  }
}
