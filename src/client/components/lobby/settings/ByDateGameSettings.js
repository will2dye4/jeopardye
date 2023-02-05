import React from 'react';
import { Button, Flex, Radio, RadioGroup, Select, Stack, Text } from '@chakra-ui/react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { EARLIEST_EPISODE_DATE, GameDateSelectionModes } from '../../../../constants.mjs';
import { isValidEpisodeDate } from '../../../../utils.mjs';
import GameSetting from './GameSetting';

const DATE_FORMAT = 'M/d/yyyy';

const MILLISECONDS_PER_DAY = 1000 * 60 * 60 * 24;

function ByDateGameSettings(props) {
  const DatePickerInput = React.forwardRef((props, ref) => (
    <Button ref={ref} colorScheme="white" textColor="black" border="1px solid black" onClick={props.onClick}
            isDisabled={props.disabled || !props.enabled}>
      {props.value}
    </Button>
  ));

  const isValidDate = (date) => isValidEpisodeDate(date, props.maxDate);

  let options = [];
  let placeholder = 'Loading...';
  if (props.seasonSummaries) {
    options = props.seasonSummaries.map(season => {
      const seasonNumber = season.seasonNumber;
      const seasonStartYear = new Date(season.seasonStartDate).getUTCFullYear();
      const seasonEnd = new Date(season.seasonEndDate);
      const seasonEndDiffDays = Math.ceil(Math.abs(new Date() - seasonEnd) / MILLISECONDS_PER_DAY);
      const seasonEndYear = (seasonEndDiffDays <= 7 ? 'present' : seasonEnd.getUTCFullYear());
      return (
        <option key={seasonNumber} value={seasonNumber}>
          Season {seasonNumber} ({seasonStartYear}&ndash;{seasonEndYear}, {season.episodeCount} episodes)
        </option>
      );
    });
    placeholder = '';
  }

  const dateRangeEnabled = (props.mode === GameDateSelectionModes.DATE_RANGE);
  let helperText;
  let selectClasses;
  if (dateRangeEnabled) {
    helperText = 'A random episode will be chosen from the selected date range. To play a specific game, set the start date and end date to the same day.';
  } else {
    helperText = 'A random episode will be chosen from the selected season.';
    selectClasses = 'hover-pointer';
  }

  return (
    <React.Fragment>
      <GameSetting cols={4} label="Episode Selection" helperText={helperText}>
        <RadioGroup pt={0} onChange={props.onModeChanged} value={props.mode}>
          <Stack spacing={5} pt={0}>
            <Flex direction="row" pt={0} pb={3}>
              <Radio colorScheme="jeopardyeBlue" isDisabled={props.disabled} value={GameDateSelectionModes.SEASON}>
                <Text fontSize="xl" align="center" lineHeight="100%" pr={5} my="auto">
                  Season
                </Text>
              </Radio>
              <Select focusBorderColor="jeopardyeBlue.500" minW="100px" w="auto" size="lg" value={props.selectedSeason}
                      onChange={props.onSeasonChanged} isDisabled={props.disabled || dateRangeEnabled}
                      placeholder={placeholder} className={selectClasses}>
                {options}
              </Select>
            </Flex>
            <Flex direction="row">
              <Radio colorScheme="jeopardyeBlue" isDisabled={props.disabled} pb={3} value={GameDateSelectionModes.DATE_RANGE}>
                <Text fontSize="xl" align="center" lineHeight="100%" pr={5} my="auto">
                  Date Range
                </Text>
              </Radio>
              <Flex direction="row" pt={0} pb={3} fontSize="lg">
                <DatePicker dateFormat={DATE_FORMAT} minDate={EARLIEST_EPISODE_DATE} maxDate={props.maxDate} filterDate={isValidDate} selected={props.startDate}
                            onChange={props.onStartDateChanged} showMonthDropdown={true} showYearDropdown={true}
                            customInput={<DatePickerInput ref={props.startDateRef} value={props.startDate} enabled={!props.disabled && dateRangeEnabled} />}
                            selectsStart startDate={props.startDate} endDate={props.endDate} />
                <Text align="left" px={3} py={1}>to</Text>
                <DatePicker dateFormat={DATE_FORMAT} minDate={props.startDate} maxDate={props.maxDate} filterDate={isValidDate} selected={props.endDate}
                            onChange={props.onEndDateChanged} showMonthDropdown={true} showYearDropdown={true}
                            customInput={<DatePickerInput ref={props.endDateRef} value={props.endDate} enabled={!props.disabled && dateRangeEnabled} />}
                            selectsEnd startDate={props.startDate} endDate={props.endDate} />
              </Flex>
            </Flex>
          </Stack>
        </RadioGroup>
      </GameSetting>
    </React.Fragment>
  );
}

export default ByDateGameSettings;
